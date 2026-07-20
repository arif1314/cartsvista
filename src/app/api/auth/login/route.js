import { ok, fail } from '@/lib/api/response';
import { ensureProfile, normalizeProfile, setAuthCookies } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function validateEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const fullName = String(body.fullName || '').trim();
    const mode = body.mode === 'signup' ? 'signup' : 'login';

    if (!validateEmail(email)) {
      return fail('Please enter a valid email address.', 422);
    }

    if (password.length < 8) {
      return fail('Password must be at least 8 characters.', 422);
    }

    const supabase = createSupabaseServerClient();
    const authResult =
      mode === 'signup'
        ? await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } },
          })
        : await supabase.auth.signInWithPassword({ email, password });

    const { data, error } = authResult;

    if (error) {
      return fail(error.message || 'Authentication failed.', 401);
    }

    if (mode === 'signup' && data.user && !data.session) {
      return ok({
        verificationRequired: true,
        message: 'Account created successfully. Please check your email and verify your account.',
      });
    }

    if (!data.session || !data.user) {
      return fail('Please verify your email before signing in.', 403);
    }

    const { profile } = await ensureProfile(data.user, fullName, data.session.access_token);
    const normalizedProfile = normalizeProfile(profile);
    if (normalizedProfile.status !== 'active') {
      return fail('This account is not active. Please contact support.', 403);
    }

    const response = ok({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      profile: normalizedProfile,
      role: normalizedProfile.role,
    });

    setAuthCookies(response, data.session, normalizedProfile.role);
    return response;
  } catch (error) {
    return fail(error.message || 'Unable to authenticate.', 500);
  }
}
