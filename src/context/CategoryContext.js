"use client";
import { createContext, useContext, useState, useEffect } from 'react';

const CategoryContext = createContext();

const initialCategories = {
  men: {
    title: "Menswear",
    collections: ["Panjabi", "Thobe & Jubba", "Koti & Waistcoat", "Footwear"]
  },
  women: {
    title: "Womenswear",
    collections: ["Abaya & Burkha", "Premium Hijab", "Salwar Kameez", "Jewelry"]
  },
  kids: {
    title: "Kids Collection",
    collections: ["Boys Panjabi", "Girls Dress", "Newborn"]
  },
  accessories: {
    title: "Accessories",
    collections: ["Perfume & Attar", "Premium Caps", "Tasbih"]
  }
};

export function CategoryProvider({ children }) {
  const [categories, setCategories] = useState(initialCategories);

  // Load from localStorage if available
  useEffect(() => {
    const saved = localStorage.getItem('cartsvista_categories');
    if (saved) {
      try {
        setCategories(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse categories");
      }
    }
  }, []);

  // Save to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cartsvista_categories', JSON.stringify(categories));
  }, [categories]);

  const addCategory = (slug, title) => {
    setCategories(prev => ({
      ...prev,
      [slug]: {
        title,
        collections: []
      }
    }));
  };

  const deleteCategory = (slug) => {
    setCategories(prev => {
      const newCats = { ...prev };
      delete newCats[slug];
      return newCats;
    });
  };

  const addSubcategory = (categorySlug, subcategoryName) => {
    setCategories(prev => {
      if (!prev[categorySlug]) return prev;
      
      const updatedCollections = [...prev[categorySlug].collections];
      if (!updatedCollections.includes(subcategoryName)) {
        updatedCollections.push(subcategoryName);
      }
      
      return {
        ...prev,
        [categorySlug]: {
          ...prev[categorySlug],
          collections: updatedCollections
        }
      };
    });
  };

  const deleteSubcategory = (categorySlug, subcategoryName) => {
    setCategories(prev => {
      if (!prev[categorySlug]) return prev;
      return {
        ...prev,
        [categorySlug]: {
          ...prev[categorySlug],
          collections: prev[categorySlug].collections.filter(c => c !== subcategoryName)
        }
      };
    });
  };

  return (
    <CategoryContext.Provider value={{ 
      categories, 
      addCategory, 
      deleteCategory, 
      addSubcategory, 
      deleteSubcategory 
    }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategory() {
  return useContext(CategoryContext);
}
