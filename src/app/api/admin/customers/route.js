import { ok, fail } from '@/lib/api/response';
import { ADMIN_ROLES, requireRole } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET(request) {
  const auth = await requireRole(request, ADMIN_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('id,email,full_name,phone,role,status,created_at,orders(id,total_amount,status)')
    .eq('role', 'customer')
    .order('created_at', { ascending: false });

  if (error) return fail(error.message, 500);

  const customers = (data || []).map((customer) => ({
    id: customer.id,
    email: customer.email,
    fullName: customer.full_name || '',
    phone: customer.phone || '',
    status: customer.status,
    createdAt: customer.created_at,
    totalOrders: customer.orders?.length || 0,
    totalSpent: (customer.orders || [])
      .filter((order) => order.status !== 'canceled')
      .reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
  }));

  return ok({ customers });
}
