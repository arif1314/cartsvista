import { ok, fail } from '@/lib/api/response';
import { requireRole, STAFF_ROLES, USER_STATUSES } from '@/lib/auth/session';
import { canManageRole, normalizeStaffProfile } from '@/lib/admin/users';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function PATCH(request, context) {
  const auth = await requireRole(request, ['super_admin', 'admin']);
  if (auth.error) return fail(auth.error, auth.status);

  const { id } = await context.params;
  if (id === auth.user.id) return fail('You cannot change your own staff access from here.', 409);

  const body = await request.json();
  const updates = {};

  if (body.fullName !== undefined || body.full_name !== undefined) updates.full_name = String(body.fullName || body.full_name || '').trim();
  if (body.phone !== undefined) updates.phone = String(body.phone || '').trim();
  if (body.role !== undefined) {
    if (!STAFF_ROLES.includes(body.role)) return fail('Invalid role.', 422);
    if (!canManageRole(auth.role, body.role)) return fail('You cannot assign this role.', 403);
    updates.role = body.role;
  }
  if (body.status !== undefined) {
    if (!USER_STATUSES.includes(body.status)) return fail('Invalid status.', 422);
    updates.status = body.status;
  }

  if (Object.keys(updates).length === 0) return fail('No staff updates supplied.', 422);

  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin
    .from('profiles')
    .select('id,role')
    .eq('id', id)
    .single();

  if (!existing || !STAFF_ROLES.includes(existing.role)) return fail('Staff member not found.', 404);
  if (!canManageRole(auth.role, existing.role)) return fail('You cannot manage this staff member.', 403);

  const { data, error } = await admin
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select('id,email,full_name,phone,role,status,created_at')
    .single();

  if (error) return fail(error.message, 500);

  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'staff.update',
    entity_type: 'profile',
    entity_id: data.id,
    metadata: updates,
  });

  return ok({ staff: normalizeStaffProfile(data) });
}
