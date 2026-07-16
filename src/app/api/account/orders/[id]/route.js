import { ok, fail } from '@/lib/api/response';
import { requireUser } from '@/lib/auth/session';
import { orderToClient } from '@/lib/format/order';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET(request, context) {
  const auth = await requireUser(request);
  if (auth.error) return fail(auth.error, auth.status);

  const { id } = await context.params;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('orders')
    .select('*, order_items(*, products(images)), order_requests(*), payments(*), notification_logs(*), order_status_events(*)')
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .single();

  if (error || !data) return fail('Order not found.', 404);
  return ok({ order: orderToClient(data) });
}
