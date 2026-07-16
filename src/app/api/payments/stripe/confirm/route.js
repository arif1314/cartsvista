import { ok, fail } from '@/lib/api/response';
import { finalizeStripeCheckoutPayment } from '@/lib/payments/finalize';
import { retrieveStripeCheckoutSession } from '@/lib/payments/stripe';
import { normalizePaymentSettings } from '@/lib/settings/store';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    if (!sessionId) return fail('Stripe session ID is required.', 422);

    const admin = createSupabaseAdminClient();
    const { data: paymentSetting } = await admin
      .from('store_settings')
      .select('value')
      .eq('key', 'payment')
      .maybeSingle();
    const paymentSettings = normalizePaymentSettings(paymentSetting?.value);

    if (!paymentSettings.stripe?.secretKey) {
      return fail('Stripe is not configured.', 422);
    }

    const session = await retrieveStripeCheckoutSession(paymentSettings.stripe.secretKey, sessionId);
    const result = await finalizeStripeCheckoutPayment(admin, session, 'success_page');

    return ok({ payment: result });
  } catch (error) {
    return fail(error.message || 'Unable to confirm Stripe payment.', 500);
  }
}
