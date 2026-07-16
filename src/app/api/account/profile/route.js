import { ok, fail } from '@/lib/api/response';
import { requireUser, normalizeProfile } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

function safeText(value, maxLength = 160) {
  return String(value || '').trim().slice(0, maxLength);
}

export async function GET(request) {
  const context = await requireUser(request);
  if (context.error) return fail(context.error, context.status);

  return ok({ profile: normalizeProfile(context.profile) });
}

export async function PATCH(request) {
  const context = await requireUser(request);
  if (context.error) return fail(context.error, context.status);

  const body = await request.json();
  const fullName = safeText(body.fullName || body.full_name);
  const phone = safeText(body.phone, 40);

  if (!fullName) {
    return fail('Full name is required.', 422);
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .update({
      full_name: fullName,
      phone,
    })
    .eq('id', context.user.id)
    .select('id,email,full_name,phone,role,status')
    .single();

  if (error) return fail(error.message, 500);

  await admin.from('audit_logs').insert({
    actor_id: context.user.id,
    action: 'profile.update',
    entity_type: 'profile',
    entity_id: context.user.id,
    metadata: {},
  });

  return ok({ profile: normalizeProfile(data) });
}
