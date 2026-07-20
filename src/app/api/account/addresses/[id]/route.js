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

function payloadFromBody(body, userId) {
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
    is_default: Boolean(body.is_default),
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

export async function PATCH(request, { params }) {
  const context = await requireUser(request);
  if (context.error) return fail(context.error, context.status);

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const payload = payloadFromBody(body, context.user.id);
  const validationError = validateAddress(payload);
  if (validationError) return fail(validationError, 422);

  const admin = createSupabaseAdminClient();

  if (payload.is_default) {
    await admin
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', context.user.id);
  }

  const { data, error } = await admin
    .from('addresses')
    .update(payload)
    .eq('id', id)
    .eq('user_id', context.user.id)
    .select('*')
    .single();

  if (error) return fail(error.message, error.code === 'PGRST116' ? 404 : 500);

  return ok({ address: addressToClient(data) });
}

export async function DELETE(request, { params }) {
  const context = await requireUser(request);
  if (context.error) return fail(context.error, context.status);

  const { id } = await params;
  const admin = createSupabaseAdminClient();

  const { data: existing, error: readError } = await admin
    .from('addresses')
    .select('id,is_default')
    .eq('id', id)
    .eq('user_id', context.user.id)
    .single();

  if (readError) return fail('Address not found.', readError.code === 'PGRST116' ? 404 : 500);

  const { error } = await admin
    .from('addresses')
    .delete()
    .eq('id', id)
    .eq('user_id', context.user.id);

  if (error) return fail(error.message, 500);

  if (existing.is_default) {
    const { data: nextAddress } = await admin
      .from('addresses')
      .select('id')
      .eq('user_id', context.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (nextAddress?.id) {
      await admin
        .from('addresses')
        .update({ is_default: true })
        .eq('id', nextAddress.id)
        .eq('user_id', context.user.id);
    }
  }

  return ok({ deleted: true });
}
