"use client";

import { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import styles from './page.module.css';

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [message, setMessage] = useState('');

  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatTitle, setNewCatTitle] = useState('');

  const [newSubcatName, setNewSubcatName] = useState('');
  const [selectedCatForSub, setSelectedCatForSub] = useState('');

  const activeCategories = useMemo(
    () => categories.filter((category) => category.isActive),
    [categories]
  );

  const fetchCategories = async () => {
    setIsLoaded(false);
    setMessage('');
    try {
      const response = await fetch('/api/admin/categories');
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load categories.');
      setCategories(data.categories || []);
    } catch (error) {
      setMessage(error.message);
      setCategories([]);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (event) => {
    event.preventDefault();
    if (!newCatTitle.trim()) return;

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatTitle.trim(),
          slug: newCatSlug.trim() || slugify(newCatTitle),
          parentId: null,
          isActive: true,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to add category.');

      setNewCatSlug('');
      setNewCatTitle('');
      setMessage('Category added.');
      fetchCategories();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      const response = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to archive category.');
      setMessage('Category archived.');
      fetchCategories();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleAddSubcategory = async (event) => {
    event.preventDefault();
    if (!selectedCatForSub || !newSubcatName.trim()) return;

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSubcatName.trim(),
          slug: slugify(`${activeCategories.find((cat) => cat.id === selectedCatForSub)?.slug || 'category'}-${newSubcatName}`),
          parentId: selectedCatForSub,
          isActive: true,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to add subcategory.');

      setNewSubcatName('');
      setMessage('Subcategory added.');
      fetchCategories();
    } catch (error) {
      setMessage(error.message);
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
          <p className={styles.subtitle}>Manage your store navigation, product categories, and subcategories.</p>
        </div>
        <button type="button" className={styles.addBtn} onClick={fetchCategories}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {message && <div className={styles.card}>{message}</div>}

      <div className={styles.grid}>
        <div className={styles.formsColumn}>
          <div className={styles.card}>
            <h3>Add New Category</h3>
            <p className={styles.cardDesc}>Creates a top-level category for navigation and product organization.</p>
            <form onSubmit={handleAddCategory} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Category Name</label>
                <input
                  type="text"
                  value={newCatTitle}
                  onChange={(event) => {
                    setNewCatTitle(event.target.value);
                    setNewCatSlug((current) => current ? current : slugify(event.target.value));
                  }}
                  placeholder="Menswear"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>URL Slug</label>
                <input
                  type="text"
                  value={newCatSlug}
                  onChange={(event) => setNewCatSlug(slugify(event.target.value))}
                  placeholder="menswear"
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
            <p className={styles.cardDesc}>Subcategories created here will appear in the product add/edit form.</p>
            <form onSubmit={handleAddSubcategory} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Parent Category</label>
                <select
                  value={selectedCatForSub}
                  onChange={(event) => setSelectedCatForSub(event.target.value)}
                  required
                >
                  <option value="">Select a category</option>
                  {activeCategories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Subcategory Name</label>
                <input
                  type="text"
                  value={newSubcatName}
                  onChange={(event) => setNewSubcatName(event.target.value)}
                  placeholder="Shirts"
                  required
                />
              </div>
              <button type="submit" className={styles.addBtn}>
                <Plus size={16} /> Add Subcategory
              </button>
            </form>
          </div>
        </div>

        <div className={styles.previewColumn}>
          <div className={styles.card}>
            <h3>Current Category Structure</h3>
            <p className={styles.cardDesc}>Inactive categories are hidden from product selection and storefront navigation.</p>

            <div className={styles.categoryList}>
              {activeCategories.length === 0 ? (
                <p className={styles.emptySub}>No active categories found.</p>
              ) : activeCategories.map((category) => (
                <div key={category.id} className={styles.categoryItem}>
                  <div className={styles.categoryHeader}>
                    <div>
                      <h4>{category.name}</h4>
                      <span className={styles.slug}>/c/{category.slug}</span>
                    </div>
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => {
                        if (confirm('Archive this category?')) handleDeleteCategory(category.id);
                      }}
                      title="Archive category"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {category.children?.length > 0 ? (
                    <ul className={styles.subcatList}>
                      {category.children.filter((child) => child.isActive).map((child) => (
                        <li key={child.id}>
                          <span>{child.name}</span>
                          <button
                            type="button"
                            className={styles.deleteSubBtn}
                            onClick={() => {
                              if (confirm('Archive this subcategory?')) handleDeleteCategory(child.id);
                            }}
                            title="Archive subcategory"
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
