import { ok, fail } from '@/lib/api/response';
import { ADMIN_ROLES, USER_STATUSES, requireRole } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function PATCH(request, context) {
  const auth = await requireRole(request, ADMIN_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const { id } = await context.params;
  const body = await request.json();
  const updates = {};

  if (body.status !== undefined) {
    if (!USER_STATUSES.includes(body.status)) return fail('Invalid customer status.', 422);
    updates.status = body.status;
  }

  if (Object.keys(updates).length === 0) return fail('No customer updates supplied.', 422);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .eq('role', 'customer')
    .select('id,email,full_name,phone,role,status,created_at')
    .single();

  if (error) return fail(error.message, 500);

  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'customer.update',
    entity_type: 'profile',
    entity_id: data.id,
    metadata: updates,
  });

  return ok({ customer: data });
}
