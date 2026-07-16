"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const CategoryContext = createContext();

export function CategoryProvider({ children }) {
  const [categories, setCategories] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });
          
        if (!error && data) {
          const catObj = {};
          data.forEach(cat => {
            catObj[cat.slug] = {
              title: cat.title,
              collections: cat.collections || []
            };
          });
          setCategories(catObj);
        }
      } catch (e) {
        console.error("Failed to fetch categories", e);
      } finally {
        setIsLoaded(true);
      }
    }
    
    fetchCategories();
  }, []);

  return (
    <CategoryContext.Provider value={{ 
      categories,
      isLoaded 
    }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategory() {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategory must be used within a CategoryProvider');
  }
  return context;
}
