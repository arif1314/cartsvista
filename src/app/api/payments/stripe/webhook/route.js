import { fail } from '@/lib/api/response';
import { finalizeStripeCheckoutPayment } from '@/lib/payments/finalize';
import { normalizePaymentSettings } from '@/lib/settings/store';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { verifyStripeWebhookSignature } from '@/lib/payments/stripe';

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature');
    const admin = createSupabaseAdminClient();
    const { data: paymentSetting } = await admin
      .from('store_settings')
      .select('value')
      .eq('key', 'payment')
      .maybeSingle();
    const paymentSettings = normalizePaymentSettings(paymentSetting?.value);
    const verification = await verifyStripeWebhookSignature(
      rawBody,
      signature,
      paymentSettings.stripe?.webhookSecret
    );

    if (!verification.ok) {
      return fail(verification.error, 400);
    }

    const event = JSON.parse(rawBody);
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      await finalizeStripeCheckoutPayment(admin, event.data.object, 'webhook');
    }

    if (event.type === 'checkout.session.async_payment_failed') {
      const session = event.data.object;
      const orderId = session?.metadata?.order_id || session?.client_reference_id;
      if (orderId) {
        const { data: payment } = await admin
          .from('payments')
          .select('*')
          .eq('order_id', orderId)
          .eq('provider', 'stripe')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (payment) {
          await admin.from('payments').update({ status: 'failed' }).eq('id', payment.id);
          await admin.from('payment_events').insert({
            payment_id: payment.id,
            order_id: orderId,
            event_type: 'stripe.checkout_session.failed',
            provider: 'stripe',
            provider_reference: session.id,
            status: 'failed',
            raw_payload: { source: 'webhook', session_id: session.id },
          });
        }

        await admin.from('orders').update({ payment_status: 'failed' }).eq('id', orderId);
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    return fail(error.message || 'Unable to process Stripe webhook.', 500);
  }
}
