import { ok, fail } from '@/lib/api/response';
import { requireUser } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function PATCH(request) {
  const context = await requireUser(request);
  if (context.error) return fail(context.error, context.status);

  const body = await request.json().catch(() => ({}));
  const newPassword = String(body.newPassword || '');
  const confirmPassword = String(body.confirmPassword || '');

  if (newPassword.length < 8) {
    return fail('Password must be at least 8 characters.', 422);
  }

  if (newPassword !== confirmPassword) {
    return fail('Passwords do not match.', 422);
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(context.user.id, {
    password: newPassword,
  });

  if (error) return fail(error.message, 500);

  await admin.from('audit_logs').insert({
    actor_id: context.user.id,
    action: 'profile.password_update',
    entity_type: 'profile',
    entity_id: context.user.id,
    metadata: {},
  });

  return ok({ message: 'Password updated successfully.' });
}
