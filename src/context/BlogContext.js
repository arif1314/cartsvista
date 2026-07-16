"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const BlogContext = createContext();

const DEFAULT_ARTICLES = [
  {
    id: 'default-article-1',
    title: 'How to Build a Timeless Modest Wardrobe',
    slug: 'timeless-modest-wardrobe',
    date: 'July 16, 2026',
    readingTime: '4 min read',
    coverImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop',
    summary: 'A practical guide to choosing versatile pieces, premium fabrics, and refined everyday silhouettes.',
    link: '/c/womenswear',
    content: '',
  },
  {
    id: 'default-article-2',
    title: 'Premium Thobe Styling for Modern Occasions',
    slug: 'premium-thobe-styling',
    date: 'July 16, 2026',
    readingTime: '3 min read',
    coverImage: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=1780&auto=format&fit=crop',
    summary: 'Simple styling choices that make classic menswear feel polished, comfortable, and contemporary.',
    link: '/c/menswear',
    content: '',
  },
  {
    id: 'default-article-3',
    title: 'Choosing Accessories That Finish the Look',
    slug: 'choosing-premium-accessories',
    date: 'July 16, 2026',
    readingTime: '3 min read',
    coverImage: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1938&auto=format&fit=crop',
    summary: 'Use texture, proportion, and restrained details to create a complete premium outfit.',
    link: '/c/accessories',
    content: '',
  },
];

export function BlogProvider({ children }) {
  const [articles, setArticles] = useState(DEFAULT_ARTICLES);
  const [isLoaded, setIsLoaded] = useState(true);

  useEffect(() => {
    async function fetchBlogs() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false });
          
        if (!error && data) {
          // Format the data similarly to how the frontend expects it
          const formatted = data.map(art => {
            const dateObj = new Date(art.created_at);
            return {
              id: art.id,
              title: art.title,
              slug: art.slug,
              date: dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
              readingTime: art.reading_time,
              coverImage: art.cover_image,
              summary: art.summary,
              link: art.related_link,
              content: art.content
            }
          });
          if (formatted.length > 0) {
            setArticles(formatted);
          }
        }
      } catch (e) {
        console.error("Failed to load blog articles from DB", e);
      } finally {
        setIsLoaded(true);
      }
    }
    
    fetchBlogs();
  }, []);

  return (
    <BlogContext.Provider value={{
      articles,
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
