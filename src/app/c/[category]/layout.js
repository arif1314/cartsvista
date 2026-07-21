import { absoluteUrl } from '@/lib/site/url';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

function titleFromSlug(slug) {
  const normalized = String(slug || '').toLowerCase();
  if (normalized === 'men' || normalized === 'menswear') return 'Menswear';
  if (normalized === 'women' || normalized === 'womenswear') return 'Womenswear';
  if (normalized === 'kids' || normalized === 'kidswear') return 'Kids Collection';
  if (normalized === 'all') return 'All Products';
  return normalized.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Collection';
}

async function categoryDetails(slug) {
  if (slug === 'all') return { name: 'All Products', slug: 'all' };
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('categories')
    .select('name,slug')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  return data || { name: titleFromSlug(slug), slug };
}

export async function generateMetadata({ params }) {
  const { category } = await params;
  const details = await categoryDetails(category);
  const title = titleFromSlug(details.name || details.slug);
  const canonical = `/c/${category}`;
  const description = `Shop the ${title} collection at CartsVista. Discover premium designs, refined craftsmanship, secure checkout, and worldwide delivery options.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: 'website', url: canonical, title, description },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function CategoryLayout({ children, params }) {
  const { category } = await params;
  const details = await categoryDetails(category);
  const title = titleFromSlug(details.name || details.slug);
  const canonicalUrl = absoluteUrl(`/c/${category}`);
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${canonicalUrl}#collection`,
      name: `${title} | CartsVista`,
      url: canonicalUrl,
      description: `Explore the ${title} collection from CartsVista.`,
      isPartOf: { '@id': `${absoluteUrl('/')}#website` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: title, item: canonicalUrl },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas).replace(/</g, '\\u003c') }}
      />
      {children}
    </>
  );
}
