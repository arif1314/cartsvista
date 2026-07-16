import { ok, fail } from '@/lib/api/response';
import { productToClient } from '@/lib/validation/product';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET(_request, context) {
  const { id } = await context.params;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('products')
    .select('*, categories(name,slug), brands(name,slug)')
    .eq('id', id)
    .eq('status', 'published')
    .single();

  if (error || !data) {
    return fail('Product not found.', 404);
  }

  return ok({ product: productToClient(data) });
}
