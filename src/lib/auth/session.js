import { createServerClient } from '@supabase/ssr';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';

export const AUTH_COOKIE = 'cv_access_token';
export const REFRESH_COOKIE = 'cv_refresh_token';
export const ROLE_COOKIE = 'cv_user_role';

export const ADMIN_ROLES = ['super_admin', 'admin', 'manager', 'support'];
export const PRODUCT_MANAGER_ROLES = ['super_admin', 'admin', 'manager'];
export const STAFF_ROLES = ['super_admin', 'admin', 'manager', 'support'];
export const USER_STATUSES = ['active', 'inactive', 'suspended'];

const isProduction = process.env.NODE_ENV === 'production';

export function getCookieValue(request, name) {
  const fromNextRequest = request.cookies?.get?.(name)?.value;
  if (fromNextRequest) return fromNextRequest;

  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

export function setAuthCookies(response, session, role = 'customer') {
  const maxAge = session.expires_in || 60 * 60 * 24 * 7;

  response.cookies.set(AUTH_COOKIE, session.access_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge,
  });

  if (session.refresh_token) {
    response.cookies.set(REFRESH_COOKIE, session.refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  response.cookies.set(ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge,
  });
}

export function clearAuthCookies(response) {
  [AUTH_COOKIE, REFRESH_COOKIE, ROLE_COOKIE].forEach((name) => {
    response.cookies.set(name, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      path: '/',
      maxAge: 0,
    });
  });
}

export async function getSessionContext(request) {
  const accessToken = getCookieValue(request, AUTH_COOKIE);
  let user = null;
  let resolvedAccessToken = accessToken || null;

  if (accessToken) {
    const supabase = createSupabaseServerClient(accessToken);
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (!error && data?.user) {
      user = data.user;
    }
  }

  if (!user) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies?.getAll?.() || [];
          },
          setAll() {},
        },
      }
    );
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) {
      user = data.user;
    }
  }

  if (!user) {
    return { user: null, profile: null, role: null, accessToken: null };
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id,email,full_name,phone,role,status')
    .eq('id', user.id)
    .single();

  const fallbackProfile = {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || '',
    role: 'customer',
    status: 'active',
  };

  return {
    user,
    profile: profile || fallbackProfile,
    role: profile?.role || 'customer',
    status: profile?.status || 'active',
    accessToken: resolvedAccessToken,
  };
}

export async function requireUser(request) {
  const context = await getSessionContext(request);
  if (!context.user) {
    return { error: 'Authentication required', status: 401 };
  }
  return context;
}

export async function requireRole(request, allowedRoles) {
  const context = await requireUser(request);
  if (context.error) return context;

  if (!allowedRoles.includes(context.role)) {
    return { error: 'Permission denied', status: 403 };
  }

  if (context.status !== 'active') {
    return { error: 'Account is not active', status: 403 };
  }

  return context;
}

export async function ensureProfile(user, fullName = '', accessToken = undefined) {
  if (accessToken) {
    const userClient = createSupabaseServerClient(accessToken);
    const { data: ownProfile } = await userClient
      .from('profiles')
      .select('id,email,full_name,phone,role,status')
      .eq('id', user.id)
      .single();

    if (ownProfile) {
      return { profile: ownProfile, error: null };
    }
  }

  const admin = createSupabaseAdminClient();
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id,email,full_name,phone,role,status')
    .eq('id', user.id)
    .single();

  if (existingProfile) {
    return { profile: existingProfile, error: null };
  }

  const profile = {
    id: user.id,
    email: user.email,
    full_name: fullName || user.user_metadata?.full_name || '',
    role: 'customer',
    status: 'active',
  };

  const { error } = await admin
    .from('profiles')
    .insert(profile);

  if (error) {
    return { profile, error };
  }

  const { data } = await admin
    .from('profiles')
    .select('id,email,full_name,phone,role,status')
    .eq('id', user.id)
    .single();

  return { profile: data || profile, error: null };
}

export function normalizeProfile(profile) {
  return {
    id: profile?.id || null,
    email: profile?.email || '',
    fullName: profile?.full_name || '',
    phone: profile?.phone || '',
    role: profile?.role || 'customer',
    status: profile?.status || 'active',
  };
}
