import { ok, fail } from '@/lib/api/response';
import { requireUser } from '@/lib/auth/session';
import { productToClient } from '@/lib/validation/product';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);
}

export async function GET(request) {
  const context = await requireUser(request);
  if (context.error) return fail(context.error, context.status);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('wishlist_items')
    .select('id, product_id, products(*)')
    .eq('user_id', context.user.id)
    .order('created_at', { ascending: false });

  if (error) return fail(error.message, 500);

  return ok({
    products: (data || [])
      .map((item) => item.products)
      .filter(Boolean)
      .map(productToClient),
  });
}

export async function POST(request) {
  const context = await requireUser(request);
  if (context.error) return fail(context.error, context.status);

  const body = await request.json();
  const productId = String(body.productId || '').trim();

  if (!isUuid(productId)) {
    return fail('Only saved database products can be synced to your account wishlist.', 422);
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('wishlist_items')
    .upsert({ user_id: context.user.id, product_id: productId }, { onConflict: 'user_id,product_id' });

  if (error) return fail(error.message, 500);

  return ok({ productId });
}

export async function DELETE(request) {
  const context = await requireUser(request);
  if (context.error) return fail(context.error, context.status);

  const { searchParams } = new URL(request.url);
  const productId = String(searchParams.get('productId') || '').trim();
  const admin = createSupabaseAdminClient();

  const query = admin.from('wishlist_items').delete().eq('user_id', context.user.id);
  const { error } = productId ? await query.eq('product_id', productId) : await query;

  if (error) return fail(error.message, 500);

  return ok({ productId: productId || null });
}
