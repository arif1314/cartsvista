import { ok, fail } from '@/lib/api/response';
import { requireRole, STAFF_ROLES } from '@/lib/auth/session';
import { canManageRole, canManageStaff, normalizeStaffProfile, parseStaffPayload } from '@/lib/admin/users';
import { createSupabaseAdminClient, hasServiceRoleKey } from '@/lib/supabase/server';

export async function GET(request) {
  const auth = await requireRole(request, ['super_admin', 'admin']);
  if (auth.error) return fail(auth.error, auth.status);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('id,email,full_name,phone,role,status,created_at')
    .in('role', STAFF_ROLES)
    .order('created_at', { ascending: false });

  if (error) return fail(error.message, 500);

  return ok({ staff: (data || []).map(normalizeStaffProfile) });
}

export async function POST(request) {
  const auth = await requireRole(request, ['super_admin', 'admin']);
  if (auth.error) return fail(auth.error, auth.status);
  if (!canManageStaff(auth.role)) return fail('Permission denied.', 403);

  const body = await request.json();
  const { staff, password, errors, isValid } = parseStaffPayload(body);
  if (!isValid) return fail('Invalid staff data.', 422, errors);
  if (!canManageRole(auth.role, staff.role)) return fail('You cannot assign this role.', 403);

  const admin = createSupabaseAdminClient();
  let userId = null;

  if (hasServiceRoleKey() && password) {
    const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
      email: staff.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: staff.full_name },
    });

    if (createError) return fail(createError.message, 500);
    userId = createdUser.user?.id;
  }

  const profilePayload = {
    id: userId || crypto.randomUUID(),
    ...staff,
  };

  const { data, error } = await admin
    .from('profiles')
    .upsert(profilePayload, { onConflict: 'id' })
    .select('id,email,full_name,phone,role,status,created_at')
    .single();

  if (error) return fail(error.message, 500);

  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'staff.create',
    entity_type: 'profile',
    entity_id: data.id,
    metadata: { email: data.email, role: data.role, auth_user_created: Boolean(userId) },
  });

  return ok({ staff: normalizeStaffProfile(data), authUserCreated: Boolean(userId) }, { status: 201 });
}
