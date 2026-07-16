import { ADMIN_ROLES, STAFF_ROLES, USER_STATUSES } from '@/lib/auth/session';

export function canManageRole(actorRole, targetRole) {
  if (actorRole === 'super_admin') return true;
  if (actorRole === 'admin') return targetRole !== 'super_admin';
  return false;
}

export function canManageStaff(actorRole) {
  return ['super_admin', 'admin'].includes(actorRole);
}

export function normalizeStaffProfile(profile) {
  return {
    id: profile.id,
    email: profile.email || '',
    fullName: profile.full_name || '',
    phone: profile.phone || '',
    role: profile.role || 'customer',
    status: profile.status || 'active',
    createdAt: profile.created_at,
  };
}

export function parseStaffPayload(body = {}) {
  const email = String(body.email || '').trim().toLowerCase();
  const fullName = String(body.fullName || body.full_name || '').trim();
  const phone = String(body.phone || '').trim();
  const role = STAFF_ROLES.includes(body.role) ? body.role : 'support';
  const status = USER_STATUSES.includes(body.status) ? body.status : 'active';
  const password = String(body.password || '').trim();
  const errors = {};

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Valid email is required.';
  if (!fullName) errors.fullName = 'Full name is required.';
  if (!ADMIN_ROLES.includes(role)) errors.role = 'Invalid staff role.';
  if (password && password.length < 8) errors.password = 'Password must be at least 8 characters.';

  return {
    staff: {
      email,
      full_name: fullName,
      phone,
      role,
      status,
    },
    password,
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}
