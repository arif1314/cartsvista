"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import styles from './page.module.css';

export default function AdminCategories() {
  const [categories, setCategories] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [newCatSlug, setNewCatSlug] = useState("");
  const [newCatTitle, setNewCatTitle] = useState("");
  
  const [newSubcatName, setNewSubcatName] = useState("");
  const [selectedCatForSub, setSelectedCatForSub] = useState("");

  const fetchCategories = async () => {
    setIsLoaded(false);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });
      
    if (!error && data) {
      const catObj = {};
      data.forEach(cat => {
        catObj[cat.slug] = {
          id: cat.id,
          title: cat.title,
          collections: cat.collections || []
        };
      });
      setCategories(catObj);
    }
    setIsLoaded(true);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatSlug || !newCatTitle) return;
    
    const slug = newCatSlug.toLowerCase().replace(/\s+/g, '-');
    const supabase = createClient();
    
    const { error } = await supabase
      .from('categories')
      .insert([{ slug, title: newCatTitle, collections: [] }]);
      
    if (!error) {
      setNewCatSlug("");
      setNewCatTitle("");
      fetchCategories();
    } else {
      alert("Failed to add category.");
    }
  };

  const handleDeleteCategory = async (slug) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('slug', slug);
      
    if (!error) {
      fetchCategories();
    } else {
      alert("Failed to delete category.");
    }
  };

  const handleAddSubcategory = async (e) => {
    e.preventDefault();
    if (!selectedCatForSub || !newSubcatName) return;
    
    const parentCat = categories[selectedCatForSub];
    if (!parentCat) return;

    const newCollections = [...parentCat.collections, newSubcatName];
    
    const supabase = createClient();
    const { error } = await supabase
      .from('categories')
      .update({ collections: newCollections, updated_at: new Date().toISOString() })
      .eq('slug', selectedCatForSub);
      
    if (!error) {
      setNewSubcatName("");
      fetchCategories();
    } else {
      alert("Failed to add subcategory.");
    }
  };

  const handleDeleteSubcategory = async (slug, subcatName) => {
    const parentCat = categories[slug];
    if (!parentCat) return;

    const newCollections = parentCat.collections.filter(c => c !== subcatName);
    
    const supabase = createClient();
    const { error } = await supabase
      .from('categories')
      .update({ collections: newCollections, updated_at: new Date().toISOString() })
      .eq('slug', slug);
      
    if (!error) {
      fetchCategories();
    } else {
      alert("Failed to delete subcategory.");
    }
  };

  if (!isLoaded) {
    return (
      <div className={styles.loading}>
        <RefreshCw size={24} className={styles.spinner} />
        Loading categories...
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Categories</h1>
          <p className={styles.subtitle}>Manage your store navigation and category structure</p>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Left Column: Management Forms */}
        <div className={styles.formsColumn}>
          
          <div className={styles.card}>
            <h3>Add New Category</h3>
            <p className={styles.cardDesc}>Creates a new main menu item in the navigation bar.</p>
            <form onSubmit={handleAddCategory} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Category Title (e.g. Winter Collection)</label>
                <input 
                  type="text" 
                  value={newCatTitle} 
                  onChange={(e) => {
                    setNewCatTitle(e.target.value);
                    if (!newCatSlug || newCatSlug === newCatTitle.toLowerCase().replace(/\s+/g, '-').slice(0, -1)) {
                      setNewCatSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }
                  }}
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>URL Slug (e.g. winter)</label>
                <input 
                  type="text" 
                  value={newCatSlug} 
                  onChange={(e) => setNewCatSlug(e.target.value)}
                  required 
                />
              </div>
              <button type="submit" className={styles.addBtn}>
                <Plus size={16} /> Add Category
              </button>
            </form>
          </div>

          <div className={styles.card}>
            <h3>Add Subcategory</h3>
            <p className={styles.cardDesc}>Adds a sub-item to the mega menu dropdown.</p>
            <form onSubmit={handleAddSubcategory} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Parent Category</label>
                <select 
                  value={selectedCatForSub} 
                  onChange={(e) => setSelectedCatForSub(e.target.value)}
                  required
                >
                  <option value="">Select a category</option>
                  {Object.entries(categories).map(([slug, cat]) => (
                    <option key={slug} value={slug}>{cat.title}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Subcategory Name (e.g. Jackets)</label>
                <input 
                  type="text" 
                  value={newSubcatName} 
                  onChange={(e) => setNewSubcatName(e.target.value)}
                  required 
                />
              </div>
              <button type="submit" className={styles.addBtn}>
                <Plus size={16} /> Add Subcategory
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Current Structure */}
        <div className={styles.previewColumn}>
          <div className={styles.card}>
            <h3>Current Category Structure</h3>
            <p className={styles.cardDesc}>This reflects exactly what customers see on the front end.</p>
            
            <div className={styles.categoryList}>
              {Object.entries(categories).map(([slug, cat]) => (
                <div key={slug} className={styles.categoryItem}>
                  <div className={styles.categoryHeader}>
                    <div>
                      <h4>{cat.title}</h4>
                      <span className={styles.slug}>/c/{slug}</span>
                    </div>
                    <button 
                      className={styles.deleteBtn}
                      onClick={() => {
                        if(confirm("Are you sure you want to delete this category?")) handleDeleteCategory(slug)
                      }}
                      title="Delete Category"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  {cat.collections && cat.collections.length > 0 ? (
                    <ul className={styles.subcatList}>
                      {cat.collections.map((sub, idx) => (
                        <li key={idx}>
                          <span>{sub}</span>
                          <button 
                            className={styles.deleteSubBtn}
                            onClick={() => handleDeleteSubcategory(slug, sub)}
                            title="Remove Subcategory"
                          >
                            &times;
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.emptySub}>No subcategories added yet.</p>
                  )}
                </div>
              ))}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
