import { ok, fail } from '@/lib/api/response';
import { PRODUCT_MANAGER_ROLES, requireRole } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function POST(request, context) {
  const auth = await requireRole(request, PRODUCT_MANAGER_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const { id } = await context.params;
  const body = await request.json();
  const delta = Number(body.delta);
  const note = String(body.note || '').trim();

  if (!Number.isInteger(delta) || delta === 0) {
    return fail('Stock adjustment must be a non-zero whole number.', 422);
  }

  const admin = createSupabaseAdminClient();
  const { data: product, error: productError } = await admin
    .from('products')
    .select('id,name,stock')
    .eq('id', id)
    .single();

  if (productError || !product) return fail('Product not found.', 404);

  const previousStock = Number(product.stock || 0);
  const newStock = previousStock + delta;

  if (newStock < 0) {
    return fail('Stock cannot be adjusted below zero.', 422);
  }

  const { data: updatedProduct, error: updateError } = await admin
    .from('products')
    .update({ stock: newStock })
    .eq('id', id)
    .select('*')
    .single();

  if (updateError) return fail(updateError.message, 500);

  await admin.from('stock_movements').insert({
    product_id: id,
    actor_id: auth.user.id,
    movement_type: 'manual_adjustment',
    delta,
    previous_stock: previousStock,
    new_stock: newStock,
    note: note || 'Manual stock adjustment from admin panel.',
    metadata: { product_name: product.name },
  });

  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'product.stock_adjust',
    entity_type: 'product',
    entity_id: id,
    metadata: {
      product_name: product.name,
      delta,
      previous_stock: previousStock,
      new_stock: newStock,
    },
  });

  return ok({ product: updatedProduct });
}
