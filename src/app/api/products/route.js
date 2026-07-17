import { ok, fail } from '@/lib/api/response';
import { productToClient } from '@/lib/validation/product';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

function normalizeCategory(value) {
  const text = String(value || '').trim().toLowerCase();
  if (text.includes('women')) return 'women';
  if (text.includes('men')) return 'men';
  return text;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = normalizeCategory(searchParams.get('category'));
  const subcategory = String(searchParams.get('subcategory') || '').trim().slice(0, 80);
  const queryText = String(searchParams.get('q') || '').trim().slice(0, 80);
  const limit = Math.min(48, Math.max(1, Number(searchParams.get('limit')) || 24));

  const admin = createSupabaseAdminClient();
  let query = admin
    .from('products')
    .select('*, categories(name,slug), brands(name,slug)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (category) {
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    query = query.or(`category.ilike.%${categoryName}%,subcategory.ilike.%${categoryName}%`);
  }

  if (subcategory) {
    const safeSubcategory = subcategory.replaceAll('%', '').replaceAll(',', ' ');
    query = query.ilike('subcategory', safeSubcategory);
  }

  if (queryText) {
    const safeQuery = queryText.replaceAll('%', '').replaceAll(',', ' ');
    query = query.or(`name.ilike.%${safeQuery}%,category.ilike.%${safeQuery}%,subcategory.ilike.%${safeQuery}%`);
  }

  const { data, error } = await query;
  if (error) return fail(error.message, 500);

  return ok({ products: (data || []).map(productToClient) });
}
