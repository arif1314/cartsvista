import { cache } from 'react';
import { notFound } from 'next/navigation';
import ProductClient from './ProductClient';
import { productToClient } from '@/lib/validation/product';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { absoluteUrl } from '@/lib/site/url';

const getProduct = cache(async (id) => {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('products')
    .select('*, categories(name,slug), brands(name,slug)')
    .eq('id', id)
    .eq('status', 'published')
    .eq('is_active', true)
    .maybeSingle();

  return data ? productToClient(data) : null;
});

function plainText(value, fallback = '') {
  return String(value || fallback)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function productDescription(product) {
  return plainText(
    product.description,
    `Shop ${product.name} from CartsVista. Premium craftsmanship, secure checkout, and worldwide delivery options.`
  ).slice(0, 160);
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: 'Product Not Found',
      robots: { index: false, follow: false },
    };
  }

  const canonical = `/product/${product.id}`;
  const description = productDescription(product);
  const image = product.images?.[0] || product.image;

  return {
    title: product.name,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      title: product.name,
      description,
      images: image ? [{ url: image, alt: product.name }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const canonicalUrl = absoluteUrl(`/product/${product.id}`);
  const price = Number(product.discount_price || product.price || 0);
  const categoryName = product.categoryName || product.category || 'Products';
  const categorySlug = product.categorySlug || String(product.category || 'all').toLowerCase();
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${canonicalUrl}#product`,
    name: product.name,
    description: productDescription(product),
    image: product.images || [product.image].filter(Boolean),
    sku: product.sku || product.id,
    category: categoryName,
    ...(product.brandName ? { brand: { '@type': 'Brand', name: product.brandName } } : {}),
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'USD',
      price,
      availability: Number(product.stock || 0) > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'CartsVista' },
    },
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: categoryName, item: absoluteUrl(`/c/${categorySlug}`) },
      { '@type': 'ListItem', position: 3, name: product.name, item: canonicalUrl },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([productSchema, breadcrumbSchema]).replace(/</g, '\\u003c') }}
      />
      <ProductClient product={product} />
    </>
  );
}
