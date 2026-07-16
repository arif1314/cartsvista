"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const PromoContext = createContext();

const DEFAULT_PROMOS = {
  slides: [
    {
      id: 'default-hero-1',
      title: 'Elevated\nEssentials',
      subtitle: 'New Season',
      image: 'https://images.unsplash.com/photo-1506629905607-d9c297d323be?q=80&w=1887&auto=format&fit=crop',
      buttonText: 'Shop Now',
      link: '/c/menswear',
    },
    {
      id: 'default-hero-2',
      title: 'Modern\nModesty',
      subtitle: 'Signature Edit',
      image: 'https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?q=80&w=1886&auto=format&fit=crop',
      buttonText: 'Explore',
      link: '/c/womenswear',
    },
  ],
  promo2: {
    id: 'default-promo-2',
    title: 'Womenswear',
    subtitle: 'Curated Collection',
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=1946&auto=format&fit=crop',
    link: '/c/womenswear',
    badge: 'NEW',
  },
  promo3: {
    id: 'default-promo-3',
    title: 'Premium Tailoring',
    subtitle: 'Menswear',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1887&auto=format&fit=crop',
    link: '/c/menswear',
    percentage: 'UP TO 25%',
  },
  promo4: {
    id: 'default-promo-4',
    title: 'Accessories',
    subtitle: 'Finishing Touches',
    image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1938&auto=format&fit=crop',
    link: '/c/accessories',
  },
  lookbooks: [],
};

export function PromoProvider({ children }) {
  const [promoData, setPromoData] = useState(DEFAULT_PROMOS);
  const [isLoaded, setIsLoaded] = useState(true);

  useEffect(() => {
    async function fetchPromos() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
          
        if (!error && data) {
          const formattedData = {
            slides: [],
            promo2: null,
            promo3: null,
            promo4: null,
            lookbooks: []
          };
          
          data.forEach(banner => {
            const formattedBanner = {
              id: banner.id,
              title: banner.title,
              subtitle: banner.subtitle,
              image: banner.image_url,
              buttonText: banner.button_text,
              link: banner.link,
              badge: banner.badge,
              percentage: banner.percentage,
              tag: banner.tag,
              fabric: banner.fabric
            };
            
            if (banner.slot === 'hero_slide') {
              formattedData.slides.push(formattedBanner);
            } else if (banner.slot === 'lookbook') {
              formattedData.lookbooks.push(formattedBanner);
            } else if (banner.slot === 'promo2') {
              formattedData.promo2 = formattedBanner;
            } else if (banner.slot === 'promo3') {
              formattedData.promo3 = formattedBanner;
            } else if (banner.slot === 'promo4') {
              formattedData.promo4 = formattedBanner;
            }
          });
          
          setPromoData({
            slides: formattedData.slides.length > 0 ? formattedData.slides : DEFAULT_PROMOS.slides,
            promo2: formattedData.promo2 || DEFAULT_PROMOS.promo2,
            promo3: formattedData.promo3 || DEFAULT_PROMOS.promo3,
            promo4: formattedData.promo4 || DEFAULT_PROMOS.promo4,
            lookbooks: formattedData.lookbooks.length > 0 ? formattedData.lookbooks : DEFAULT_PROMOS.lookbooks,
          });
        }
      } catch (e) {
        console.error("Failed to fetch promos", e);
      } finally {
        setIsLoaded(true);
      }
    }
    
    fetchPromos();
  }, []);

  return (
    <PromoContext.Provider value={{ 
      ...promoData,
      isLoaded 
    }}>
      {children}
    </PromoContext.Provider>
  );
}

export function usePromos() {
  const context = useContext(PromoContext);
  if (!context) {
    throw new Error('usePromos must be used within a PromoProvider');
  }
  return context;
}
