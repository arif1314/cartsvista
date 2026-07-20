import { ok, fail } from '@/lib/api/response';
import { requireUser } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

function addressToClient(address) {
  return {
    id: address.id,
    user_id: address.user_id,
    label: address.label || 'Home',
    full_name: address.full_name || '',
    phone: address.phone || '',
    address: address.line1 || '',
    apartment: address.line2 || '',
    line1: address.line1 || '',
    line2: address.line2 || '',
    city: address.city || '',
    postal_code: address.postal_code || '',
    country: address.country || 'United States',
    is_default: Boolean(address.is_default),
    created_at: address.created_at,
  };
}

function payloadFromBody(body, userId, forceDefault = false) {
  return {
    user_id: userId,
    label: String(body.label || 'Home').trim() || 'Home',
    full_name: String(body.full_name || body.fullName || '').trim(),
    phone: String(body.phone || '').trim(),
    line1: String(body.address || body.line1 || '').trim(),
    line2: String(body.apartment || body.line2 || '').trim(),
    city: String(body.city || '').trim(),
    postal_code: String(body.postal_code || body.postalCode || '').trim(),
    country: String(body.country || 'United States').trim() || 'United States',
    is_default: forceDefault || Boolean(body.is_default),
  };
}

function validateAddress(payload) {
  if (!payload.full_name) return 'Full name is required.';
  if (!payload.phone) return 'Phone number is required.';
  if (!payload.line1) return 'Street address is required.';
  if (!payload.city) return 'City is required.';
  if (!payload.postal_code) return 'Postal code is required.';
  return null;
}

export async function GET(request) {
  const context = await requireUser(request);
  if (context.error) return fail(context.error, context.status);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('addresses')
    .select('*')
    .eq('user_id', context.user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) return fail(error.message, 500);

  const addresses = (data || []).map(addressToClient);
  return ok({
    addresses,
    summary: {
      totalAddresses: addresses.length,
      defaultAddress: addresses.find((address) => address.is_default) || null,
    },
  });
}

export async function POST(request) {
  const context = await requireUser(request);
  if (context.error) return fail(context.error, context.status);

  const body = await request.json().catch(() => ({}));
  const admin = createSupabaseAdminClient();

  const { count } = await admin
    .from('addresses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', context.user.id);

  const payload = payloadFromBody(body, context.user.id, !count);
  const validationError = validateAddress(payload);
  if (validationError) return fail(validationError, 422);

  if (payload.is_default) {
    await admin
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', context.user.id);
  }

  const { data, error } = await admin
    .from('addresses')
    .insert(payload)
    .select('*')
    .single();

  if (error) return fail(error.message, 500);

  return ok({ address: addressToClient(data) }, { status: 201 });
}
