import { absoluteUrl } from '@/lib/site/url';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const staticRoutes = [
  '/',
  '/apps',
  '/contact',
  '/store-locations',
  '/pages/shipping-policy',
  '/pages/terms-conditions',
  '/pages/privacy-policy',
  '/pages/exchange-refund',
  '/pages/payment-policy',
];

export default async function sitemap() {
  const admin = createSupabaseAdminClient();
  const [productsResult, categoriesResult] = await Promise.all([
    admin
      .from('products')
      .select('id,updated_at,created_at')
      .eq('status', 'published')
      .limit(1000),
    admin
      .from('categories')
      .select('slug,updated_at,created_at')
      .eq('is_active', true)
      .limit(500),
  ]);

  const now = new Date();
  const staticEntries = staticRoutes.map((route) => ({
    url: absoluteUrl(route),
    lastModified: now,
    changeFrequency: route === '/' ? 'daily' : 'monthly',
    priority: route === '/' ? 1 : 0.6,
  }));

  const productEntries = (productsResult.data || []).map((product) => ({
    url: absoluteUrl(`/product/${product.id}`),
    lastModified: new Date(product.updated_at || product.created_at || now),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const categoryEntries = (categoriesResult.data || []).map((category) => ({
    url: absoluteUrl(`/c/${category.slug}`),
    lastModified: new Date(category.updated_at || category.created_at || now),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
