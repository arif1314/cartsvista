import { ok, fail } from '@/lib/api/response';
import { ADMIN_ROLES, requireRole } from '@/lib/auth/session';
import { queueNotification } from '@/lib/notifications/log';
import { normalizeNotificationSettings } from '@/lib/settings/store';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const REQUEST_STATUSES = ['pending', 'approved', 'rejected', 'resolved'];

async function restoreOrderStock(admin, order, request, actorId) {
  const items = order.order_items || [];

  for (const item of items) {
    if (!item.product_id) continue;

    const { data: product } = await admin
      .from('products')
      .select('id,name,stock')
      .eq('id', item.product_id)
      .single();

    if (!product) continue;

    const previousStock = Number(product.stock || 0);
    const quantity = Number(item.quantity || 0);
    const newStock = previousStock + quantity;

    await admin
      .from('products')
      .update({ stock: newStock })
      .eq('id', product.id);

    await admin.from('stock_movements').insert({
      product_id: product.id,
      order_id: order.id,
      actor_id: actorId,
      movement_type: 'return',
      delta: quantity,
      previous_stock: previousStock,
      new_stock: newStock,
      note: `Stock restored after ${request.request_type} request approval.`,
      metadata: {
        request_id: request.id,
        product_name: product.name,
      },
    });
  }
}

async function getNotificationSettings(admin) {
  const { data } = await admin
    .from('store_settings')
    .select('value')
    .eq('key', 'notification')
    .maybeSingle();

  return normalizeNotificationSettings(data?.value);
}

export async function PATCH(request, context) {
  const auth = await requireRole(request, ADMIN_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const { id } = await context.params;
  const body = await request.json();
  const status = String(body.status || '').toLowerCase();

  if (!REQUEST_STATUSES.includes(status)) {
    return fail('Invalid request status.', 422);
  }

  const admin = createSupabaseAdminClient();
  const { data: existingRequest, error: requestError } = await admin
    .from('order_requests')
    .select('*, orders(id,status,payment_status,total_amount,customer_email,shipping_address,order_items(id,product_id,product_name,quantity))')
    .eq('id', id)
    .single();

  if (requestError || !existingRequest) return fail('Order request not found.', 404);

  if (existingRequest.status === 'approved' && status === 'approved') {
    return fail('This request has already been approved.', 409);
  }

  const { data, error } = await admin
    .from('order_requests')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return fail(error.message, 500);

  const order = existingRequest.orders;

  if (status === 'approved' && order) {
    const orderUpdates = data.request_type === 'cancel'
      ? { status: 'canceled' }
      : { status: 'refunded', payment_status: 'refunded' };

    await admin
      .from('orders')
      .update(orderUpdates)
      .eq('id', data.order_id);

    if (!['canceled', 'refunded'].includes(order.status)) {
      await restoreOrderStock(admin, order, data, auth.user.id);
    }

    if (data.request_type === 'refund') {
      const { data: payment } = await admin
        .from('payments')
        .select('*')
        .eq('order_id', data.order_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (payment) {
        await admin
          .from('payments')
          .update({ status: 'refunded' })
          .eq('id', payment.id);

        await admin.from('payment_events').insert({
          payment_id: payment.id,
          order_id: data.order_id,
          event_type: 'payment.refund_approved',
          provider: payment.provider,
          provider_reference: payment.provider_reference,
          status: 'refunded',
          raw_payload: { request_id: data.id, approved_by: auth.user.id },
        });
      }
    }

    await admin.from('order_status_events').insert({
      order_id: data.order_id,
      actor_id: auth.user.id,
      event_type: `order_request.${data.request_type}_approved`,
      from_status: order.status,
      to_status: orderUpdates.status,
      note: `${data.request_type} request approved.`,
      metadata: { request_id: data.id, payment_status: orderUpdates.payment_status || order.payment_status },
    });
  } else if (order) {
    await admin.from('order_status_events').insert({
      order_id: data.order_id,
      actor_id: auth.user.id,
      event_type: `order_request.${status}`,
      from_status: order.status,
      to_status: order.status,
      note: `${data.request_type} request marked ${status}.`,
      metadata: { request_id: data.id },
    });
  }

  const notificationSettings = await getNotificationSettings(admin);
  const customerEmail = order?.customer_email || order?.shipping_address?.email;
  if (customerEmail) {
    await queueNotification(admin, {
      userId: data.user_id,
      orderId: data.order_id,
      channel: 'email',
      recipient: customerEmail,
      subject: `Your ${data.request_type} request was ${status}`,
      message: `Your ${data.request_type} request for order ${data.order_id.slice(0, 8).toUpperCase()} was marked ${status}.`,
      metadata: { request_id: data.id, notification_type: 'order_request_customer_update' },
    });
  }

  if (notificationSettings.adminEmail && status !== 'pending') {
    await queueNotification(admin, {
      orderId: data.order_id,
      channel: 'email',
      recipient: notificationSettings.adminEmail,
      subject: `Order request ${status}`,
      message: `${data.request_type} request for order ${data.order_id.slice(0, 8).toUpperCase()} was marked ${status}.`,
      metadata: { request_id: data.id, notification_type: 'order_request_admin_update' },
    });
  }

  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'order_request.status_update',
    entity_type: 'order_request',
    entity_id: data.id,
    metadata: { status, order_id: data.order_id },
  });

  return ok({ request: data });
}
