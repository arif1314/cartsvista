import { ok, fail } from '@/lib/api/response';
import { getSessionContext } from '@/lib/auth/session';
import { formatCurrency } from '@/lib/format/currency';
import { orderConfirmationMessage, queueNotification } from '@/lib/notifications/log';
import { createGuestOrderAccessToken } from '@/lib/orders/guest-access';
import { createStripeCheckoutSession } from '@/lib/payments/stripe';
import { calculateShippingAmount, normalizeShippingSettings } from '@/lib/settings/shipping';
import {
  calculateTaxAmount,
  enabledPaymentMethods,
  normalizeNotificationSettings,
  normalizePaymentSettings,
  normalizeTaxSettings,
} from '@/lib/settings/store';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { parseCheckoutPayload } from '@/lib/validation/checkout';

function calculateCouponDiscount(coupon, subtotal) {
  if (!coupon || !coupon.is_active) return { discount: 0, reason: null };

  const now = Date.now();
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) {
    return { discount: 0, reason: 'Coupon is not active yet.' };
  }

  if (coupon.ends_at && new Date(coupon.ends_at).getTime() < now) {
    return { discount: 0, reason: 'Coupon has expired.' };
  }

  if (Number(coupon.min_order_amount || 0) > subtotal) {
    return { discount: 0, reason: `Minimum order amount is ${formatCurrency(coupon.min_order_amount)}.` };
  }

  if (coupon.usage_limit && Number(coupon.used_count || 0) >= Number(coupon.usage_limit)) {
    return { discount: 0, reason: 'Coupon usage limit reached.' };
  }

  const rawDiscount = coupon.discount_type === 'percentage'
    ? subtotal * (Number(coupon.discount_value || 0) / 100)
    : Number(coupon.discount_value || 0);
  const cappedDiscount = coupon.max_discount_amount
    ? Math.min(rawDiscount, Number(coupon.max_discount_amount))
    : rawDiscount;

  return {
    discount: Math.min(subtotal, Math.max(0, cappedDiscount)),
    reason: null,
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const origin = request.headers.get('origin') || new URL(request.url).origin;
    const { checkout, errors, isValid } = parseCheckoutPayload(body);

    if (!isValid) {
      return fail('Invalid checkout data.', 422, errors);
    }

    const context = await getSessionContext(request);
    const admin = createSupabaseAdminClient();
    const invalidCatalogItem = checkout.items.find((item) => !item.isUuidProduct);
    if (invalidCatalogItem) {
      return fail('One or more cart items are no longer available. Please remove them and add products again from the store.', 422);
    }

    const uuidProductIds = checkout.items
      .filter((item) => item.isUuidProduct)
      .map((item) => item.productId);
    const uniqueProductIds = Array.from(new Set(uuidProductIds));

    let productPriceMap = new Map();
    if (uniqueProductIds.length > 0) {
      const { data, error } = await admin
        .from('products')
        .select('id,name,price,stock,status')
        .in('id', uniqueProductIds);

      if (error) return fail(error.message, 500);
      productPriceMap = new Map((data || []).map((product) => [product.id, product]));
    }

    if (productPriceMap.size !== uniqueProductIds.length) {
      return fail('One or more products in your cart are unavailable.', 422);
    }

    const orderItems = checkout.items.map((item) => {
      const dbProduct = productPriceMap.get(item.productId);
      const price = Number(dbProduct.price);

      return {
        product_id: dbProduct ? item.productId : null,
        product_name: dbProduct?.name || item.name,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        price,
      };
    });

    const stockError = checkout.items.find((item) => {
      const dbProduct = productPriceMap.get(item.productId);
      return dbProduct && (dbProduct.status === 'archived' || Number(dbProduct.stock) < item.quantity);
    });

    if (stockError) {
      return fail(`Insufficient stock for ${stockError.name}.`, 409);
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let coupon = null;
    let discount = 0;

    if (checkout.couponCode) {
      const { data: couponData, error: couponError } = await admin
        .from('coupons')
        .select('*')
        .eq('code', checkout.couponCode)
        .single();

      if (couponError || !couponData) {
        return fail('Coupon code is invalid.', 422);
      }

      coupon = couponData;
      const couponResult = calculateCouponDiscount(coupon, subtotal);
      if (couponResult.reason) {
        return fail(couponResult.reason, 422);
      }
      discount = couponResult.discount;
    }

    const { data: shippingSetting } = await admin
      .from('store_settings')
      .select('value')
      .eq('key', 'shipping')
      .single();
    const { data: paymentSetting } = await admin
      .from('store_settings')
      .select('value')
      .eq('key', 'payment')
      .maybeSingle();
    const { data: taxSetting } = await admin
      .from('store_settings')
      .select('value')
      .eq('key', 'tax')
      .maybeSingle();
    const { data: notificationSetting } = await admin
      .from('store_settings')
      .select('value')
      .eq('key', 'notification')
      .maybeSingle();

    const paymentSettings = normalizePaymentSettings(paymentSetting?.value);
    const availablePaymentMethods = enabledPaymentMethods(paymentSettings);
    if (!availablePaymentMethods.includes(checkout.paymentMethod)) {
      return fail('This payment method is currently unavailable.', 422);
    }

    const shippingSettings = normalizeShippingSettings(shippingSetting?.value);
    const shipping = calculateShippingAmount(subtotal, checkout.shippingAddress.city, shippingSettings);
    const taxSettings = normalizeTaxSettings(taxSetting?.value);
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = calculateTaxAmount(taxableAmount, taxSettings);
    const total = Math.max(0, subtotal + shipping + tax - discount);

    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        user_id: context.user?.id || null,
        customer_email: checkout.shippingAddress.email,
        subtotal_amount: subtotal,
        shipping_amount: shipping,
        discount_amount: discount,
        tax_amount: tax,
        total_amount: total,
        status: 'pending',
        payment_status: checkout.paymentMethod === 'cod' ? 'unpaid' : 'pending',
        shipping_address: checkout.shippingAddress,
        payment_method: checkout.paymentMethod,
      })
      .select('*')
      .single();

    if (orderError) return fail(orderError.message, 500);

    const itemsToInsert = orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await admin.from('order_items').insert(itemsToInsert);

    if (itemsError) {
      return fail(itemsError.message, 500);
    }

    const guestAccessToken = createGuestOrderAccessToken(
      order.id,
      checkout.shippingAddress.email
    );

    const stockUpdates = checkout.items
      .filter((item) => item.isUuidProduct && productPriceMap.has(item.productId))
      .map((item) => admin.rpc('decrement_product_stock', {
        product_id: item.productId,
        qty: item.quantity,
        order_id: order.id,
        actor_id: context.user?.id || null,
      }));

    if (stockUpdates.length > 0) {
      const stockResults = await Promise.all(stockUpdates);
      const stockError = stockResults.find((result) => result.error)?.error;
      if (stockError) {
        return fail(stockError.message, 500);
      }
      const rejectedStock = stockResults.find((result) => result.data === false);
      if (rejectedStock) {
        return fail('One or more products no longer have enough stock.', 409);
      }
    }

    if (coupon) {
      await admin
        .from('coupons')
        .update({ used_count: Number(coupon.used_count || 0) + 1 })
        .eq('id', coupon.id);
    }

    const provider = checkout.paymentMethod || 'cod';
    const initialPaymentStatus = checkout.paymentMethod === 'cod' ? 'unpaid' : 'pending';
    const providerReference = `${provider.toUpperCase()}-${String(order.id).slice(0, 8).toUpperCase()}`;
    let responsePaymentReference = providerReference;
    const { data: payment } = await admin
      .from('payments')
      .insert({
        order_id: order.id,
        provider,
        provider_reference: providerReference,
        amount: total,
        status: initialPaymentStatus,
        raw_payload: {
          initialized: true,
          payment_method: checkout.paymentMethod,
        },
      })
      .select('*')
      .single();

    if (payment) {
      await admin.from('payment_events').insert({
        payment_id: payment.id,
        order_id: order.id,
        event_type: 'payment.initialized',
        provider,
        provider_reference: providerReference,
        status: initialPaymentStatus,
        raw_payload: { payment_method: checkout.paymentMethod },
      });
    }

    let paymentRedirectUrl = '';
    if (checkout.paymentMethod === 'stripe') {
      const stripeSession = await createStripeCheckoutSession({
        stripeSettings: paymentSettings.stripe,
        order,
        items: orderItems,
        successUrl: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}&access=${encodeURIComponent(guestAccessToken)}`,
        cancelUrl: `${origin}/checkout/cancel?order_id=${order.id}`,
        customerEmail: checkout.shippingAddress.email,
      });

      paymentRedirectUrl = stripeSession.url || '';
      responsePaymentReference = stripeSession.id;
      if (!paymentRedirectUrl) {
        return fail('Stripe did not return a checkout URL.', 500);
      }

      if (payment) {
        await admin
          .from('payments')
          .update({
            provider_reference: stripeSession.id,
            raw_payload: {
              initialized: true,
              payment_method: checkout.paymentMethod,
              checkout_session_id: stripeSession.id,
              checkout_url: paymentRedirectUrl,
              stripe_currency: paymentSettings.stripe.currency,
            },
          })
          .eq('id', payment.id);

        await admin.from('payment_events').insert({
          payment_id: payment.id,
          order_id: order.id,
          event_type: 'stripe.checkout_session.created',
          provider,
          provider_reference: stripeSession.id,
          status: 'pending',
          raw_payload: {
            session_id: stripeSession.id,
            payment_intent: stripeSession.payment_intent || null,
          },
        });
      }
    }

    await admin.from('order_status_events').insert({
      order_id: order.id,
      actor_id: context.user?.id || null,
      event_type: 'order.created',
      to_status: 'pending',
      note: 'Order placed from checkout.',
      metadata: {
        payment_method: checkout.paymentMethod,
        total_amount: total,
      },
    });

    const notificationSettings = normalizeNotificationSettings(notificationSetting?.value);
    if (notificationSettings.orderEmail) {
      await queueNotification(admin, {
        userId: context.user?.id || null,
        orderId: order.id,
        channel: 'email',
        recipient: checkout.shippingAddress.email,
        subject: 'CartsVista order received',
        message: orderConfirmationMessage(order.id, total),
        metadata: { payment_method: checkout.paymentMethod },
      });
    }

    if (notificationSettings.orderSms && checkout.shippingAddress.phone) {
      await queueNotification(admin, {
        userId: context.user?.id || null,
        orderId: order.id,
        channel: 'sms',
        recipient: checkout.shippingAddress.phone,
        subject: 'CartsVista order received',
        message: orderConfirmationMessage(order.id, total),
        metadata: { payment_method: checkout.paymentMethod, notification_type: 'customer_order_sms' },
      });
    }

    if (notificationSettings.adminEmail) {
      await queueNotification(admin, {
        userId: null,
        orderId: order.id,
        channel: 'email',
        recipient: notificationSettings.adminEmail,
        subject: 'New CartsVista order',
        message: `New order ${String(order.id).slice(0, 8).toUpperCase()} was placed. Total amount: ${formatCurrency(total)}.`,
        metadata: { payment_method: checkout.paymentMethod, notification_type: 'admin_order_alert' },
      });
    }

    await admin.from('audit_logs').insert({
      actor_id: context.user?.id || null,
      action: 'order.create',
      entity_type: 'order',
      entity_id: order.id,
      metadata: { total_amount: total, payment_method: checkout.paymentMethod },
    });

    return ok({
      order: {
        id: order.id,
        totalAmount: Number(order.total_amount),
        subtotalAmount: Number(order.subtotal_amount),
        shippingAmount: Number(order.shipping_amount),
        discountAmount: Number(order.discount_amount),
        taxAmount: Number(order.tax_amount),
        status: order.status,
        paymentStatus: order.payment_status,
        paymentReference: responsePaymentReference,
        paymentRedirectUrl,
        guestAccessToken,
      },
    }, { status: 201 });
  } catch (error) {
    return fail(error.message || 'Unable to place order.', 500);
  }
}
