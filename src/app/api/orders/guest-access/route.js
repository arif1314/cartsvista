import { ok, fail } from '@/lib/api/response';
import { createGuestOrderAccessToken } from '@/lib/orders/guest-access';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request) {
  try {
    const body = await request.json();
    const orderId = String(body.orderId || '').trim();
    const email = String(body.email || '').trim().toLowerCase();

    if (!UUID_PATTERN.test(orderId) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail('Enter a valid order number and checkout email.', 422);
    }

    const admin = createSupabaseAdminClient();
    const { data: order } = await admin
      .from('orders')
      .select('id,customer_email')
      .eq('id', orderId)
      .maybeSingle();

    if (!order || String(order.customer_email || '').trim().toLowerCase() !== email) {
      return fail('We could not find an order matching those details.', 404);
    }

    return ok({
      orderId: order.id,
      accessToken: createGuestOrderAccessToken(order.id, order.customer_email),
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return fail(error.message || 'Unable to verify this order.', 500);
  }
}
