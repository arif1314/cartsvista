"use client";

import { createContext, useContext, useState, useEffect } from 'react';

const PromoContext = createContext();

const DEFAULT_STATE = {
  slides: [
    {
      id: "slide_1",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop",
      title: "SUMMER\nEDITION 2026",
      subtitle: "CartsVista Exclusives",
      buttonText: "Explore Collection",
      link: "/c/menswear"
    },
    {
      id: "slide_2",
      image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=2070",
      title: "NEW BEACHWEAR\nAUTUMN 2026",
      subtitle: "Upcoming Styles",
      buttonText: "Shop Collection",
      link: "/c/menswear"
    }
  ],
  promo2: {
    id: "promo2",
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop",
    title: "FLASH SALE",
    subtitle: "MID-SUMMER",
    badge: "EXCLUSIVELY ONLINE",
    link: "/c/womenswear"
  },
  promo3: {
    id: "promo3",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1932&auto=format&fit=crop",
    title: "ARTFUL LIVING",
    subtitle: "SAVE IN STYLE",
    percentage: "20% OFF",
    link: "/c/accessories"
  },
  promo4: {
    id: "promo4",
    image: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=2070&auto=format&fit=crop",
    title: "Beat the Heat!",
    link: "/c/fragrance"
  },
  lookbooks: [
    {
      id: "look_1",
      title: "The Festive Elegance",
      subtitle: "Traditional Heritage",
      tag: "Festive",
      fabric: "Premium Silk Blend",
      image: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=1780",
      link: "/c/menswear"
    },
    {
      id: "look_2",
      title: "Modest Chic",
      subtitle: "Contemporary Grace",
      tag: "Modest",
      fabric: "Linen & Georgette",
      image: "https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?q=80&w=1886",
      link: "/c/womenswear"
    },
    {
      id: "look_3",
      title: "Minimalist Casuals",
      subtitle: "Effortless Comfort",
      tag: "Casual",
      fabric: "100% Breathable Cotton",
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=2071",
      link: "/c/menswear"
    }
  ]
};

export function PromoProvider({ children }) {
  const [promoData, setPromoData] = useState({ 
    slides: [], 
    promo2: null, 
    promo3: null, 
    promo4: null, 
    lookbooks: [] 
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cartsvista_hybrid_promos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Fallback for older localStorage that didn't have lookbooks
        if (!parsed.lookbooks) {
          parsed.lookbooks = DEFAULT_STATE.lookbooks;
        }
        setPromoData(parsed);
      } catch (e) {
        console.error("Failed to load saved hybrid promos", e);
        setPromoData(DEFAULT_STATE);
      }
    } else {
      setPromoData(DEFAULT_STATE);
    }
    setIsLoaded(true);
  }, []);

  const savePromoData = (newData) => {
    setPromoData(newData);
    localStorage.setItem('cartsvista_hybrid_promos', JSON.stringify(newData));
  };

  const addSlide = (slideData) => {
    const newSlide = {
      ...slideData,
      id: `slide_${Date.now()}`
    };
    const nextSlides = [...promoData.slides, newSlide];
    savePromoData({
      ...promoData,
      slides: nextSlides
    });
  };

  const updateSlide = (id, updatedFields) => {
    const nextSlides = promoData.slides.map(slide => 
      slide.id === id ? { ...slide, ...updatedFields } : slide
    );
    savePromoData({
      ...promoData,
      slides: nextSlides
    });
  };

  const deleteSlide = (id) => {
    const nextSlides = promoData.slides.filter(slide => slide.id !== id);
    savePromoData({
      ...promoData,
      slides: nextSlides
    });
  };

  const moveSlide = (index, direction) => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= promoData.slides.length) return;

    const nextSlides = [...promoData.slides];
    const temp = nextSlides[index];
    nextSlides[index] = nextSlides[nextIndex];
    nextSlides[nextIndex] = temp;
    savePromoData({
      ...promoData,
      slides: nextSlides
    });
  };

  const updateStaticPromo = (promoId, updatedFields) => {
    savePromoData({
      ...promoData,
      [promoId]: {
        ...promoData[promoId],
        ...updatedFields
      }
    });
  };

  const addLook = (lookData) => {
    const newLook = {
      ...lookData,
      id: `look_${Date.now()}`
    };
    const nextLooks = [...promoData.lookbooks, newLook];
    savePromoData({
      ...promoData,
      lookbooks: nextLooks
    });
  };

  const updateLook = (id, updatedFields) => {
    const nextLooks = promoData.lookbooks.map(look => 
      look.id === id ? { ...look, ...updatedFields } : look
    );
    savePromoData({
      ...promoData,
      lookbooks: nextLooks
    });
  };

  const deleteLook = (id) => {
    const nextLooks = promoData.lookbooks.filter(look => look.id !== id);
    savePromoData({
      ...promoData,
      lookbooks: nextLooks
    });
  };

  const resetPromos = () => {
    localStorage.removeItem('cartsvista_hybrid_promos');
    setPromoData(DEFAULT_STATE);
  };

  return (
    <PromoContext.Provider value={{ 
      slides: promoData.slides, 
      promo2: promoData.promo2, 
      promo3: promoData.promo3, 
      promo4: promoData.promo4, 
      lookbooks: promoData.lookbooks,
      addSlide, 
      updateSlide, 
      deleteSlide, 
      moveSlide, 
      updateStaticPromo, 
      addLook,
      updateLook,
      deleteLook,
      resetPromos, 
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
