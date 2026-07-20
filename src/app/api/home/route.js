import { ok, fail } from '@/lib/api/response';
import { categoriesToNavigation } from '@/lib/catalog/format';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { productToClient } from '@/lib/validation/product';

function normalizedCategory(value) {
  const text = String(value || '').trim().toLowerCase();
  if (text.includes('women')) return 'women';
  if (text.includes('men')) return 'men';
  if (text.includes('kid')) return 'kids';
  if (text.includes('accessor')) return 'accessories';
  return text;
}

function formatCategoryTitle(category) {
  const value = String(category?.title || category?.name || '').trim().toLowerCase();
  if (value === 'men') return 'Menswear';
  if (value === 'women') return 'Womenswear';
  if (value === 'kids') return 'Kids Collection';
  if (value === 'accessories') return 'Accessories';
  return category?.title || category?.name || 'Collection';
}

export async function GET() {
  const admin = createSupabaseAdminClient();

  const [categoryResult, productResult] = await Promise.all([
    admin
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    admin
      .from('products')
      .select('id,name,slug,price,discount_price,category,subcategory,images,sizes,colors,stock,status,sku,created_at,is_active,categories(name,slug),brands(name,slug)')
      .eq('status', 'published')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(160),
  ]);

  if (categoryResult.error) return fail(categoryResult.error.message, 500);
  if (productResult.error) return fail(productResult.error.message, 500);

  const products = (productResult.data || []).map(productToClient);
  const categories = categoriesToNavigation(categoryResult.data || []);

  const sections = categories
    .map((category) => {
      const categoryKey = normalizedCategory(category.slug || category.name);
      const subcategories = (category.children || [])
        .filter((subcategory) => subcategory.isActive)
        .map((subcategory) => {
          const subcategoryKey = String(subcategory.name || '').trim().toLowerCase();
          const subcategoryProducts = products
            .filter((product) => (
              normalizedCategory(product.category) === categoryKey
              && String(product.subcategory || '').trim().toLowerCase() === subcategoryKey
            ))
            .slice(0, 1);

          return {
            ...subcategory,
            products: subcategoryProducts,
          };
        })
        .filter((subcategory) => subcategory.products.length > 0);

      return {
        ...category,
        title: formatCategoryTitle(category),
        subcategories,
      };
    })
    .filter((section) => section.subcategories.length > 0);

  return ok(
    {
      latestProducts: products.slice(0, 8),
      catalogSections: sections,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  );
}
