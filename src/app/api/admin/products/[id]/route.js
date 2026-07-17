import { ok, fail } from '@/lib/api/response';
import { PRODUCT_MANAGER_ROLES, requireRole } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { parseProductPayload, productToClient } from '@/lib/validation/product';

export async function GET(request, context) {
  const auth = await requireRole(request, PRODUCT_MANAGER_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const { id } = await context.params;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('products')
    .select('*, categories(name,slug), brands(name,slug), stock_movements(*)')
    .eq('id', id)
    .single();

  if (error) return fail('Product not found.', 404);
  return ok({ product: productToClient(data) });
}

export async function PATCH(request, context) {
  const auth = await requireRole(request, PRODUCT_MANAGER_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const { id } = await context.params;
  const body = await request.json();
  const { product, errors, isValid } = parseProductPayload(body);

  if (!isValid) {
    return fail('Invalid product data.', 422, errors);
  }

  const admin = createSupabaseAdminClient();
  const { data: existingProduct, error: existingError } = await admin
    .from('products')
    .select('id,name,stock')
    .eq('id', id)
    .single();

  if (existingError) return fail('Product not found.', 404);

  const { data, error } = await admin
    .from('products')
    .update(product)
    .eq('id', id)
    .select('*, categories(name,slug), brands(name,slug)')
    .single();

  if (error) return fail(error.message, 500);

  if (Number(existingProduct.stock) !== Number(data.stock)) {
    await admin.from('stock_movements').insert({
      product_id: data.id,
      actor_id: auth.user.id,
      movement_type: 'manual_adjustment',
      delta: Number(data.stock) - Number(existingProduct.stock),
      previous_stock: Number(existingProduct.stock),
      new_stock: Number(data.stock),
      note: 'Stock changed from product edit form.',
      metadata: { product_name: data.name },
    });
  }

  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'product.update',
    entity_type: 'product',
    entity_id: data.id,
    metadata: { name: data.name },
  });

  return ok({ product: productToClient(data) });
}

export async function DELETE(request, context) {
  const auth = await requireRole(request, PRODUCT_MANAGER_ROLES);
  if (auth.error) return fail(auth.error, auth.status);

  const { id } = await context.params;
  const admin = createSupabaseAdminClient();
  const { data: existingProduct, error: existingError } = await admin
    .from('products')
    .select('id,name')
    .eq('id', id)
    .single();

  if (existingError) return fail('Product not found.', 404);

  const { count: orderItemCount, error: countError } = await admin
    .from('order_items')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', id);

  if (countError) return fail(countError.message, 500);

  if (Number(orderItemCount || 0) === 0) {
    await Promise.all([
      admin.from('stock_movements').delete().eq('product_id', id),
      admin.from('wishlist_items').delete().eq('product_id', id),
    ]);

    const { error: deleteError } = await admin
      .from('products')
      .delete()
      .eq('id', id);

    if (deleteError) return fail(deleteError.message, 500);

    await admin.from('audit_logs').insert({
      actor_id: auth.user.id,
      action: 'product.delete',
      entity_type: 'product',
      entity_id: id,
      metadata: { name: existingProduct.name },
    });

    return ok({ deleted: true, product: { id, name: existingProduct.name } });
  }

  const { data, error } = await admin
    .from('products')
    .update({ status: 'archived' })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return fail(`${error.message}. This product has order history, so it must be archived instead of permanently deleted.`, 500);

  await admin.from('audit_logs').insert({
    actor_id: auth.user.id,
    action: 'product.archive',
    entity_type: 'product',
    entity_id: data.id,
    metadata: { name: data.name },
  });

  return ok({ product: productToClient(data) });
}
