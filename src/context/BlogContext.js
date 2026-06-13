"use client";

import { createContext, useContext, useState, useEffect } from 'react';

const BlogContext = createContext();

const DEFAULT_ARTICLES = [
  {
    id: "art_1",
    title: "How to Style a Pastel Thobe for Summer Occasions",
    slug: "style-pastel-thobe-summer",
    date: "June 10, 2026",
    readingTime: "4 min read",
    coverImage: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=1780",
    summary: "Discover the art of styling pastel-colored thobes with minimal accessories, premium footwear, and breathable fabrics for ultimate summer comfort.",
    link: "/c/menswear",
    content: `
      <p>Summer in South Asia calls for clothing that is both breathable and dignified. As temperatures rise, the Thobe remains a timeless option for men. However, styling it for modern summer occasions requires a balance of tradition, fabric selection, and modern accessorizing.</p>
      
      <h3>1. Why Pastels Work for Summer</h3>
      <p>Dark colors absorb heat, whereas pastel tones—like soft mint green, powder blue, light beige, and rose pink—reflect sunlight. These shades keep you cooler while offering a refreshing visual aesthetic that stands out in formal gatherings.</p>
      
      <h3>2. Fabric Selection: Cotton vs. Linen</h3>
      <p>The foundation of a good thobe is its fabric. For hot days, look for:</p>
      <ul>
        <li><strong>Breathable Cotton:</strong> Offers structural crispness and is ideal for morning events.</li>
        <li><strong>Linen Blends:</strong> Extremely lightweight and naturally breathable, perfect for hot afternoons.</li>
      </ul>

      <blockquote>
        "Minimalism is the ultimate sophistication. When styling a pastel thobe, let the color and drape do the talking."
      </blockquote>

      <h3>3. Essential Footwear and Accessories</h3>
      <p>To elevate your pastel thobe, choose your accessories carefully:</p>
      <ul>
        <li><strong>Premium Leather sandals:</strong> Traditional Peshawari or premium leather slide sandals in tan or chocolate brown create a beautiful contrast.</li>
        <li><strong>Classic Watches:</strong> A simple silver or leather-strap watch adds an understated touch of elegance.</li>
        <li><strong>Oud Fragrance:</strong> Complement your clean look with a light, warm woody scent from our premium fragrance collection.</li>
      </ul>
    `
  },
  {
    id: "art_2",
    title: "The Essential Guide to Choosing Premium Abaya Fabrics",
    slug: "premium-abaya-fabric-guide",
    date: "June 08, 2026",
    readingTime: "5 min read",
    coverImage: "https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?q=80&w=1886",
    summary: "From lightweight Crepe to luxurious Nidha fabric, explore the drape, breathability, and aesthetic of different fabrics to choose your perfect daily abaya.",
    link: "/c/womenswear",
    content: `
      <p>An Abaya is more than just an outer garment; it is an expression of grace and modest elegance. When selecting an abaya, the fabric defines its comfort, drape, and longevity. Today we explore the most popular premium fabrics to help you make an informed choice.</p>
      
      <h3>1. Luxurious Nidha Fabric</h3>
      <p>Nidha is widely considered the king of abaya fabrics. It is 100% polyester, highly breathable, silky soft, and flows beautifully. It has a subtle sheen that makes it perfect for formal events and evening wear.</p>
      
      <h3>2. Practical and Elegant Crepe</h3>
      <p>If you are looking for an everyday abaya, crepe is your best friend. It has a textured surface, resists wrinkling, and holds its shape exceptionally well. Lightweight wool-crepe blends provide excellent drape without adding weight.</p>

      <h3>3. Breathable Linen & Cotton</h3>
      <p>For hot, humid days, natural fibers are unmatched:</p>
      <ul>
        <li><strong>Linen Abayas:</strong> Provide a relaxed, contemporary look and keep you incredibly cool.</li>
        <li><strong>Cotton Voile:</strong> Best for casual indoor wear, extremely soft and skin-friendly.</li>
      </ul>

      <blockquote>
        "The right fabric dictates how an abaya moves with you. Choose Nidha for flow, and Crepe for daily structural durability."
      </blockquote>

      <h3>4. Caring for Your Premium Fabrics</h3>
      <p>To keep your premium abayas looking new, always hand wash them in cold water or use a delicate machine cycle inside a mesh laundry bag. Hang them to dry in the shade to protect the rich color dyes.</p>
    `
  },
  {
    id: "art_3",
    title: "Scent Profiles: The Royal Oud and Rose Combination",
    slug: "royal-oud-rose-scent-profile",
    date: "June 05, 2026",
    readingTime: "6 min read",
    coverImage: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1904",
    summary: "Discover the deep history, formulation, and sublime elegance of combining rich Cambodian Oud with premium Turkish Rose for a classic oriental fragrance.",
    link: "/c/fragrance",
    content: `
      <p>The combination of Oud and Rose is one of the most celebrated and luxurious scent profiles in the history of perfumery. Known for its rich, complex, and captivating nature, this pairing blends the deep, woody warmth of Oud with the sweet, romantic floral notes of Rose.</p>
    `
  },
  {
    id: "art_4",
    title: "Minimalist Modest Wear: How to Curate a Capsule Wardrobe",
    slug: "minimalist-modest-wear-capsule-wardrobe",
    date: "June 01, 2026",
    readingTime: "5 min read",
    coverImage: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=2070&auto=format&fit=crop",
    summary: "Learn how to build a highly versatile and elegant modest capsule wardrobe with just 10 high-quality, interchangeable heritage pieces.",
    link: "/c/womenswear",
    content: `
      <p>Building a capsule wardrobe is an excellent way to practice sustainable fashion while ensuring you always look elegant and put together. For modest wear, this means selecting versatile, premium quality items that can be styled in multiple ways.</p>
    `
  }
];

export function BlogProvider({ children }) {
  const [articles, setArticles] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cartsvista_editorial_blogs');
    if (saved) {
      try {
        setArticles(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved blog articles", e);
        setArticles(DEFAULT_ARTICLES);
      }
    } else {
      setArticles(DEFAULT_ARTICLES);
    }
    setIsLoaded(true);
  }, []);

  const saveArticles = (newArticles) => {
    setArticles(newArticles);
    localStorage.setItem('cartsvista_editorial_blogs', JSON.stringify(newArticles));
  };

  const addArticle = (articleData) => {
    const slug = articleData.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const newArticle = {
      ...articleData,
      id: `art_${Date.now()}`,
      slug,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    };

    saveArticles([...articles, newArticle]);
  };

  const updateArticle = (id, updatedFields) => {
    const nextArticles = articles.map(art => {
      if (art.id === id) {
        let slug = art.slug;
        if (updatedFields.title && updatedFields.title !== art.title) {
          slug = updatedFields.title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
        }
        return { ...art, ...updatedFields, slug };
      }
      return art;
    });
    saveArticles(nextArticles);
  };

  const deleteArticle = (id) => {
    saveArticles(articles.filter(art => art.id !== id));
  };

  const resetBlogs = () => {
    localStorage.removeItem('cartsvista_editorial_blogs');
    setArticles(DEFAULT_ARTICLES);
  };

  return (
    <BlogContext.Provider value={{
      articles,
      addArticle,
      updateArticle,
      deleteArticle,
      resetBlogs,
      isLoaded
    }}>
      {children}
    </BlogContext.Provider>
  );
}

export function useBlogs() {
  const context = useContext(BlogContext);
  if (!context) {
    throw new Error('useBlogs must be used within a BlogProvider');
  }
  return context;
}
