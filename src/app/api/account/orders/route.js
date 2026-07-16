import { ok, fail } from '@/lib/api/response';
import { requireUser } from '@/lib/auth/session';
import { orderToClient } from '@/lib/format/order';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET(request) {
  const context = await requireUser(request);
  if (context.error) return fail(context.error, context.status);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('orders')
    .select('*, order_items(*, products(images)), payments(*)')
    .eq('user_id', context.user.id)
    .order('created_at', { ascending: false });

  if (error) return fail(error.message, 500);

  const orders = (data || []).map(orderToClient);
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

  return ok({
    orders,
    summary: {
      totalOrders: orders.length,
      totalSpent,
      recentOrder: orders[0] || null,
    },
  });
}
