import { absoluteUrl } from '@/lib/site/url';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { footerPagesData } from '@/data/footerPagesData';

const staticRoutes = [
  '/',
  '/apps',
  '/contact',
  '/store-locations',
  ...Object.keys(footerPagesData).map((slug) => `/pages/${slug}`),
  '/campaign/summer-edition-2026',
  '/campaign/new-beachwear-autumn-2026',
  '/campaign/flash-sale',
  '/campaign/artful-living',
  '/campaign/beat-the-heat',
];

export default async function sitemap() {
  const admin = createSupabaseAdminClient();
  const [productsResult, categoriesResult, articlesResult] = await Promise.all([
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
    admin
      .from('articles')
      .select('slug,created_at')
      .eq('is_published', true)
      .limit(1000),
  ]);

  const now = new Date();
  const staticEntries = staticRoutes.map((route) => ({
    url: absoluteUrl(route),
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

  const articleEntries = (articlesResult.data || []).map((article) => ({
    url: absoluteUrl(`/blog/${article.slug}`),
    lastModified: new Date(article.created_at || now),
    changeFrequency: 'monthly',
    priority: 0.65,
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries, ...articleEntries];
}
