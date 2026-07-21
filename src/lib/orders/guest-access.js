import { createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_VERSION = 'v1';

function guestAccessSecret() {
  const secret = process.env.GUEST_ORDER_ACCESS_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error('Guest order access is not configured.');
  }

  return secret;
}

function tokenPayload(orderId, email) {
  return `${TOKEN_VERSION}:${String(orderId || '').trim()}:${String(email || '').trim().toLowerCase()}`;
}

export function createGuestOrderAccessToken(orderId, email) {
  return createHmac('sha256', guestAccessSecret())
    .update(tokenPayload(orderId, email))
    .digest('base64url');
}

export function verifyGuestOrderAccessToken(orderId, email, suppliedToken) {
  if (!suppliedToken) return false;

  const expected = createGuestOrderAccessToken(orderId, email);
  const suppliedBuffer = Buffer.from(String(suppliedToken));
  const expectedBuffer = Buffer.from(expected);

  return suppliedBuffer.length === expectedBuffer.length
    && timingSafeEqual(suppliedBuffer, expectedBuffer);
}
