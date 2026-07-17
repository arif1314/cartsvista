"use client";
import { createContext, useContext, useState, useEffect } from 'react';

const CategoryContext = createContext();

function displayCategoryTitle(category) {
  const value = String(category.title || category.name || '').trim();
  if (category.slug === 'men' || value.toLowerCase() === 'men') return 'Menswear';
  if (category.slug === 'women' || value.toLowerCase() === 'women') return 'Womenswear';
  if (category.slug === 'kids' || value.toLowerCase() === 'kids') return 'Kids Collection';
  return value;
}

export function CategoryProvider({ children }) {
  const [categories, setCategories] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();

        if (response.ok && data.success) {
          const catObj = {};
          (data.categories || []).forEach(cat => {
            catObj[cat.slug] = {
              id: cat.id,
              title: displayCategoryTitle(cat),
              name: cat.name || cat.title,
              slug: cat.slug,
              collections: cat.collections || [],
              children: cat.children || [],
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
