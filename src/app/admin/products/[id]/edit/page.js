"use client";
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import ProductImageManager from '@/components/admin/ProductImageManager';
import styles from '../../new/page.module.css';

export default function EditProduct({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [stockDelta, setStockDelta] = useState('');
  const [stockNote, setStockNote] = useState('');
  const [images, setImages] = useState([]);
  const [productName, setProductName] = useState('');
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [brandId, setBrandId] = useState('');

  async function loadProduct() {
    try {
      const response = await fetch(`/api/admin/products/${id}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to load product.');
      }

      setProduct(data.product);
      setProductName(data.product.name || '');
      setImages((data.product.images || []).map((url) => ({ url, path: '' })));
      setCategoryId(data.product.categoryId || '');
      setSubcategory(data.product.subcategory || '');
      setBrandId(data.product.brandId || '');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProduct();
  }, [id]);

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

    const formData = new FormData(e.currentTarget);
    const selectedCategory = categories.find((category) => category.id === categoryId);
    const updatedProduct = {
      name: formData.get('name'),
      description: formData.get('description') || null,
      price: parseFloat(formData.get('price')),
      stock: parseInt(formData.get('stock')) || 0,
      category: selectedCategory?.name || product.category,
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
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to update product.');
      }

      alert('Product updated successfully!');
      router.push('/admin/products');
      router.refresh();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockAdjustment = async () => {
    setIsAdjustingStock(true);
    setErrorMessage('');

    try {
      const response = await fetch(`/api/admin/products/${id}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delta: parseInt(stockDelta),
          note: stockNote,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to adjust stock.');
      }

      setStockDelta('');
      setStockNote('');
      await loadProduct();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsAdjustingStock(false);
    }
  };

  if (isLoading) {
    return <div className={styles.container}>Loading product...</div>;
  }

  if (!product) {
    return <div className={styles.container}>{errorMessage || 'Product not found.'}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/admin/products" className={styles.backBtn}>
          <ArrowLeft size={18} /> Back to Products
        </Link>
        <div className={styles.titleWrapper}>
          <h1 className={styles.title}>Edit Product</h1>
          <p className={styles.subtitle}>Update catalog, pricing, inventory, and publication status.</p>
        </div>
      </div>

      <form key={`${product.id}-${product.stock}`} onSubmit={handleSubmit} className={styles.formLayout}>
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
                value={productName}
                onChange={(event) => setProductName(event.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea name="description" rows="5" defaultValue={product.description || ''}></textarea>
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
              <input type="number" name="price" defaultValue={product.price} required />
            </div>
            <div className={styles.formGroup}>
              <label>Stock Quantity</label>
              <input type="number" name="stock" defaultValue={product.stock || 0} />
            </div>
            <div className={styles.formGroup}>
              <label>SKU</label>
              <input type="text" name="sku" defaultValue={product.sku || ''} />
            </div>
          </div>

          <div className={styles.card}>
            <h3>Stock Adjustment</h3>
            <div className={styles.formGroup}>
              <label>Add or Remove Quantity</label>
              <input
                type="number"
                value={stockDelta}
                onChange={(e) => setStockDelta(e.target.value)}
                placeholder="Example: 10 or -3"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Reason / Note</label>
              <input
                type="text"
                value={stockNote}
                onChange={(e) => setStockNote(e.target.value)}
                placeholder="Restock, damaged item, correction..."
              />
            </div>
            <button
              type="button"
              className={styles.publishBtn}
              disabled={isAdjustingStock || !stockDelta}
              onClick={handleStockAdjustment}
            >
              {isAdjustingStock ? 'Adjusting...' : 'Apply Stock Adjustment'}
            </button>
          </div>

          <div className={styles.card}>
            <h3>Stock History</h3>
            <div className={styles.movementList}>
              {product.stockMovements?.length === 0 ? (
                <p className={styles.movementNote}>No stock movement yet.</p>
              ) : product.stockMovements
                .slice()
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((movement) => (
                  <div key={movement.id} className={styles.movementItem}>
                    <div>
                      <p className={styles.movementTitle}>
                        {movement.type} ({movement.delta > 0 ? `+${movement.delta}` : movement.delta})
                      </p>
                      <p className={styles.movementNote}>
                        {movement.previousStock} to {movement.newStock}
                        {movement.note ? ` - ${movement.note}` : ''}
                      </p>
                    </div>
                    <span>{new Date(movement.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
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
              <input type="text" name="sizes" defaultValue={(product.sizes || []).join(',')} />
            </div>
            <div className={styles.formGroup}>
              <label>Colors</label>
              <input type="text" name="colors" defaultValue={(product.colors || []).join(',')} />
            </div>
            <div className={styles.formGroup}>
              <label>Status</label>
              <select name="status" defaultValue={product.status || 'published'}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className={styles.actionCard}>
            <button type="button" className={styles.discardBtn} onClick={() => router.push('/admin/products')}>Cancel</button>
            <button type="submit" className={styles.publishBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
