import { absoluteUrl } from '@/lib/site/url';

const campaignSeo = {
  'summer-edition-2026': {
    title: 'Summer Edition 2026',
    description: 'Lightweight tailoring, refined cotton, and warm-weather essentials curated for a polished summer wardrobe.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop',
  },
  'new-beachwear-autumn-2026': {
    title: 'New Beachwear Autumn 2026',
    description: 'Relaxed silhouettes, coastal colors, and easy layering pieces for travel, weekends, and early autumn escapes.',
    image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=2070&auto=format&fit=crop',
  },
  'flash-sale': {
    title: 'The Summer Sale',
    description: 'Shop selected occasionwear, statement pieces, and refined everyday essentials in the CartsVista Summer Sale.',
    image: '/promos/promo2-seasonal-sale.webp',
  },
  'artful-living': {
    title: 'Modern Tailoring',
    description: 'Discover precision construction, refined details, and timeless finishing from the CartsVista atelier.',
    image: '/promos/promo3-modern-tailoring.webp',
  },
  'beat-the-heat': {
    title: 'Finishing Touches',
    description: 'Explore fragrance, watches, silk accents, and signature accessories selected to complete a considered wardrobe.',
    image: '/promos/promo4-signature-accessories.webp',
  },
};

function detailsFor(slug) {
  return campaignSeo[slug] || {
    title: 'CartsVista Collection',
    description: 'Explore a curated fashion and lifestyle collection from CartsVista.',
    image: '/promos/promo3-modern-tailoring.webp',
  };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const details = detailsFor(slug);
  const canonical = `/campaign/${slug}`;
  return {
    title: details.title,
    description: details.description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      title: details.title,
      description: details.description,
      images: [{ url: details.image, alt: details.title }],
    },
    twitter: { card: 'summary_large_image', title: details.title, description: details.description, images: [details.image] },
  };
}

export default async function CampaignLayout({ children, params }) {
  const { slug } = await params;
  const details = detailsFor(slug);
  const canonicalUrl = absoluteUrl(`/campaign/${slug}`);
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${canonicalUrl}#collection`,
      name: details.title,
      description: details.description,
      image: details.image.startsWith('http') ? details.image : absoluteUrl(details.image),
      url: canonicalUrl,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: details.title, item: canonicalUrl },
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
