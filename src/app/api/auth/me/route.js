import { ok, fail } from '@/lib/api/response';
import { getSessionContext, normalizeProfile } from '@/lib/auth/session';

export async function GET(request) {
  const context = await getSessionContext(request);

  if (!context.user) {
    return fail('Authentication required', 401);
  }

  return ok({
    user: {
      id: context.user.id,
      email: context.user.email,
    },
    profile: normalizeProfile(context.profile),
    role: context.role,
  });
}
