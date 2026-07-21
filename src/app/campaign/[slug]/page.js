"use client";

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import styles from './page.module.css';

const CAMPAIGNS = {
  'summer-edition-2026': {
    eyebrow: 'Seasonal Edit',
    title: 'Summer Edition 2026',
    subtitle: 'Lightweight tailoring, refined cotton, and warm-weather essentials curated for a polished summer wardrobe.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop',
    imagePosition: 'center',
    queries: [
      { category: 'men', subcategory: 'T-Shirts' },
      { category: 'men', subcategory: 'Chinos' },
      { category: 'women', subcategory: 'Tops' },
    ],
  },
  'new-beachwear-autumn-2026': {
    eyebrow: 'Resort Preview',
    title: 'New Beachwear Autumn 2026',
    subtitle: 'Relaxed silhouettes, coastal colors, and easy layering pieces for travel, weekends, and early autumn escapes.',
    image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=2070&auto=format&fit=crop',
    imagePosition: 'center',
    queries: [
      { category: 'men', subcategory: 'T-Shirts' },
      { category: 'women', subcategory: 'Jeans & Pants' },
      { category: 'kids', subcategory: 'Casualwear & Sets' },
    ],
  },
  'flash-sale': {
    eyebrow: 'Seasonal Edit · 2026',
    title: 'The Summer Sale',
    subtitle: 'Up to 50% off selected occasionwear, statement pieces, and refined everyday essentials.',
    image: '/promos/promo2-seasonal-sale.webp',
    imagePosition: '68% center',
    queries: [
      { category: 'women', subcategory: 'Dresses' },
      { category: 'men', subcategory: 'Shirts' },
      { category: 'kids', subcategory: 'Dresses & Occasionwear' },
    ],
  },
  'artful-living': {
    eyebrow: 'The Atelier',
    title: 'Modern Tailoring',
    subtitle: 'Precision in every detail, from refined construction to timeless finishing.',
    image: '/promos/promo3-modern-tailoring.webp',
    imagePosition: '64% center',
    tone: 'light',
    queries: [
      { category: 'women', subcategory: 'Kurtis & Tunics' },
      { category: 'women', subcategory: 'Tops' },
      { category: 'men', subcategory: 'Blazer' },
    ],
  },
  'beat-the-heat': {
    eyebrow: 'The Signature Edit',
    title: 'Finishing Touches',
    subtitle: 'Fragrance, watches, and silk accents selected to complete a considered wardrobe.',
    image: '/promos/promo4-signature-accessories.webp',
    imagePosition: '64% center',
    queries: [
      { category: 'men', subcategory: 'T-Shirts' },
      { category: 'kids', subcategory: 'Casualwear & Sets' },
      { category: 'women', subcategory: 'Tops' },
    ],
  },
};

export default function CampaignPage({ params }) {
  const resolvedParams = use(params);
  const campaign = CAMPAIGNS[resolvedParams.slug] || CAMPAIGNS['summer-edition-2026'];
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);
      try {
        const groups = await Promise.all(campaign.queries.map(async (query) => {
          const response = await fetch(
            `/api/products?category=${encodeURIComponent(query.category)}&subcategory=${encodeURIComponent(query.subcategory)}&limit=8`
          );
          const data = await response.json();
          return response.ok && data.success ? data.products || [] : [];
        }));

        const unique = new Map();
        groups.flat().forEach((product) => {
          if (product?.id && !unique.has(product.id)) unique.set(product.id, product);
        });

        if (isMounted) setProducts(Array.from(unique.values()).slice(0, 24));
      } catch {
        if (isMounted) setProducts([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProducts();
    return () => {
      isMounted = false;
    };
  }, [campaign]);

  const groupedProducts = useMemo(() => {
    return campaign.queries.map((query) => ({
      ...query,
      products: products.filter((product) => product.category === query.category && product.subcategory === query.subcategory),
    })).filter((group) => group.products.length > 0);
  }, [campaign, products]);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <Image
          src={campaign.image}
          alt={campaign.title}
          fill
          sizes="100vw"
          loading="eager"
          style={{ objectPosition: campaign.imagePosition || 'center' }}
        />
        <div className={`${styles.heroOverlay} ${campaign.tone === 'light' ? styles.heroOverlayLight : ''}`} />
        <div className={`${styles.heroContent} ${campaign.tone === 'light' ? styles.heroContentLight : ''}`}>
          <Link href="/" className={styles.backLink}>
            <ChevronLeft size={16} /> Back to store
          </Link>
          <span>{campaign.eyebrow}</span>
          <h1>{campaign.title}</h1>
          <p>{campaign.subtitle}</p>
        </div>
      </section>

      <section className={styles.content}>
        {isLoading ? (
          <div className={styles.grid}>
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className={styles.skeletonCard} />
            ))}
          </div>
        ) : groupedProducts.length > 0 ? (
          groupedProducts.map((group) => (
            <div key={`${group.category}-${group.subcategory}`} className={styles.group}>
              <div className={styles.groupHeader}>
                <div>
                  <span>{group.category}</span>
                  <h2>{group.subcategory}</h2>
                </div>
                <Link href={`/c/${group.category}?subcategory=${encodeURIComponent(group.subcategory)}`}>
                  View All
                </Link>
              </div>
              <div className={styles.grid}>
                {group.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <h2>No products found</h2>
            <p>This edit is being curated. Please explore the full store.</p>
            <Link href="/c/all">Explore Store</Link>
          </div>
        )}
      </section>
    </main>
  );
}
