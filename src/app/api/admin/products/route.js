import { ok, fail } from '@/lib/api/response';
import { PRODUCT_MANAGER_ROLES, requireRole } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { parseProductPayload, productToClient } from '@/lib/validation/product';

export async function GET(request) {
  const context = await requireRole(request, PRODUCT_MANAGER_ROLES);
  if (context.error) return fail(context.error, context.status);

  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get('includeArchived') === 'true';
  const admin = createSupabaseAdminClient();

  let query = admin
    .from('products')
    .select('*, categories(name,slug), brands(name,slug)')
    .order('created_at', { ascending: false });

  if (!includeArchived) {
    query = query.neq('status', 'archived');
  }

  const { data, error } = await query;
  if (error) return fail(error.message, 500);

  return ok({ products: (data || []).map(productToClient) });
}

export async function POST(request) {
  const context = await requireRole(request, PRODUCT_MANAGER_ROLES);
  if (context.error) return fail(context.error, context.status);

  const body = await request.json();
  const { product, errors, isValid } = parseProductPayload(body);

  if (!isValid) {
    return fail('Invalid product data.', 422, errors);
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('products')
    .insert(product)
    .select('*')
    .single();

  if (error) return fail(error.message, 500);

  await admin.from('audit_logs').insert({
    actor_id: context.user.id,
    action: 'product.create',
    entity_type: 'product',
    entity_id: data.id,
    metadata: { name: data.name },
  });

  if (Number(data.stock || 0) > 0) {
    await admin.from('stock_movements').insert({
      product_id: data.id,
      actor_id: context.user.id,
      movement_type: 'initial',
      delta: Number(data.stock),
      previous_stock: 0,
      new_stock: Number(data.stock),
      note: 'Initial stock added when product was created.',
      metadata: { product_name: data.name },
    });
  }

  return ok({ product: productToClient(data) }, { status: 201 });
}
