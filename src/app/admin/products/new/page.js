"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import ProductImageManager from '@/components/admin/ProductImageManager';
import styles from './page.module.css';

export default function AddProduct() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [images, setImages] = useState([]);
  const [productName, setProductName] = useState('');
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [brandId, setBrandId] = useState('');

  useEffect(() => {
    async function loadCatalog() {
      try {
        const [categoryResponse, brandResponse] = await Promise.all([
          fetch('/api/admin/categories'),
          fetch('/api/admin/brands'),
        ]);
        const [categoryData, brandData] = await Promise.all([
          categoryResponse.json(),
          brandResponse.json(),
        ]);
        if (categoryData.success) setCategories(categoryData.categories || []);
        if (brandData.success) setBrands((brandData.brands || []).filter((brand) => brand.isActive));
      } catch {
        setErrorMessage('Unable to load categories or brands.');
      }
    }

    loadCatalog();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    
    const formData = new FormData(e.target);
    const selectedCategory = categories.find((category) => category.id === categoryId);
    const newProduct = {
      name: formData.get('name'),
      description: formData.get('description') || null,
      price: parseFloat(formData.get('price')),
      stock: parseInt(formData.get('stock')) || 0,
      category: selectedCategory?.name || '',
      categoryId,
      subcategory: subcategory || null,
      brandId: brandId || null,
      images: images.map((image) => image.url),
      sizes: formData.get('sizes') || 'S,M,L',
      colors: formData.get('colors') || '',
      status: formData.get('status') || 'published',
      sku: formData.get('sku') || null,
    };

    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to add product.');
      }

      alert('Product added successfully!');
      router.push('/admin/products');
      router.refresh();
    } catch (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/admin/products" className={styles.backBtn}>
          <ArrowLeft size={18} /> Back to Products
        </Link>
        <div className={styles.titleWrapper}>
          <h1 className={styles.title}>Add New Product</h1>
          <p className={styles.subtitle}>Fill in the details to publish a new product.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.formLayout}>
        <div className={styles.mainColumn}>
          {errorMessage && (
            <div className={styles.card} style={{ color: '#9f1d1d' }}>
              {errorMessage}
            </div>
          )}

          <div className={styles.card}>
            <h3>Basic Information</h3>
            <div className={styles.formGroup}>
              <label>Product Name *</label>
              <input
                type="text"
                name="name"
                placeholder="e.g. Royal Emerald Thobe"
                value={productName}
                onChange={(event) => setProductName(event.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea name="description" rows="5" placeholder="Detailed product description..."></textarea>
            </div>
          </div>

          <div className={styles.card}>
            <h3>Media</h3>
            <ProductImageManager
              images={images}
              setImages={setImages}
              productName={productName}
              setErrorMessage={setErrorMessage}
            />
          </div>
        </div>

        <div className={styles.sideColumn}>
          <div className={styles.card}>
            <h3>Pricing & Inventory</h3>
            <div className={styles.formGroup}>
              <label>Price (USD) *</label>
              <input type="number" name="price" placeholder="0.00" required />
            </div>
            <div className={styles.formGroup}>
              <label>Stock Quantity</label>
              <input type="number" name="stock" placeholder="10" />
            </div>
            <div className={styles.formGroup}>
              <label>SKU</label>
              <input type="text" name="sku" placeholder="CV-THOBE-001" />
            </div>
          </div>

          <div className={styles.card}>
            <h3>Organization</h3>
            <div className={styles.formGroup}>
              <label>Category *</label>
              <select
                name="categoryId"
                value={categoryId}
                onChange={(event) => {
                  setCategoryId(event.target.value);
                  setSubcategory('');
                }}
                required
              >
                <option value="">Select Category</option>
                {categories.filter((category) => category.isActive).map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Subcategory</label>
              <select value={subcategory} onChange={(event) => setSubcategory(event.target.value)}>
                <option value="">No subcategory</option>
                {(categories.find((category) => category.id === categoryId)?.children || [])
                  .filter((child) => child.isActive)
                  .map((child) => (
                    <option key={child.id} value={child.name}>{child.name}</option>
                  ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Brand</label>
              <select value={brandId} onChange={(event) => setBrandId(event.target.value)}>
                <option value="">No brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Sizes</label>
              <input type="text" name="sizes" placeholder="S,M,L,XL" defaultValue="S,M,L" />
            </div>
            <div className={styles.formGroup}>
              <label>Colors</label>
              <input type="text" name="colors" placeholder="Black,White,Emerald" />
            </div>
            <div className={styles.formGroup}>
              <label>Status</label>
              <select name="status" defaultValue="published">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div className={styles.actionCard}>
            <button type="button" className={styles.discardBtn} onClick={() => router.push('/admin/products')}>Discard</button>
            <button type="submit" className={styles.publishBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Publishing...' : 'Publish Product'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
