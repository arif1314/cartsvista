import { ok, fail } from '@/lib/api/response';
import { orderToClient } from '@/lib/format/order';
import { verifyGuestOrderAccessToken } from '@/lib/orders/guest-access';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET(request, context) {
  try {
    const { id } = await context.params;
    const accessToken = new URL(request.url).searchParams.get('access');
    const admin = createSupabaseAdminClient();
    const { data: order, error } = await admin
      .from('orders')
      .select('*, order_items(*, products(images)), payments(*), order_status_events(*)')
      .eq('id', id)
      .maybeSingle();

    if (error || !order) return fail('Order not found.', 404);

    if (!verifyGuestOrderAccessToken(order.id, order.customer_email, accessToken)) {
      return fail('This guest order link is invalid.', 403);
    }

    return ok({ order: orderToClient(order) }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    return fail(error.message || 'Unable to load this order.', 500);
  }
}
