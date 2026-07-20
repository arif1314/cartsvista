import { ok, fail } from '@/lib/api/response';
import { productToClient } from '@/lib/validation/product';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

function normalizeCategory(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text || text === 'all') return '';
  if (text.includes('women')) return 'women';
  if (text.includes('men')) return 'men';
  if (text.includes('kid')) return 'kids';
  if (text.includes('accessor')) return 'accessories';
  return text;
}

function categoryAliases(category) {
  if (category === 'men') return ['men', 'Menswear'];
  if (category === 'women') return ['women', 'Womenswear'];
  if (category === 'kids') return ['kids', 'Kidswear', 'Kids Collection'];
  if (category === 'accessories') return ['accessories', 'Accessories'];
  return [category];
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
    const filters = categoryAliases(category)
      .map((alias) => alias.replaceAll('%', '').replaceAll(',', ' ').trim())
      .filter(Boolean)
      .map((alias) => `category.ilike.${alias}`);
    if (filters.length > 0) {
      query = query.or(filters.join(','));
    }
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
