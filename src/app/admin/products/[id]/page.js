"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UploadCloud, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

export default function EditProduct({ params }) {
  const router = useRouter();
  const { id } = params;
  const isNew = id === 'new';
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    subcategory: '',
    images: [],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: []
  });

  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (!isNew) {
      fetchProduct();
    }
  }, [id]);

  async function fetchProduct() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (data) {
      setProduct({
        ...data,
        images: data.images || [],
        sizes: data.sizes || ['S', 'M', 'L', 'XL'],
        colors: data.colors || []
      });
    } else {
      alert("Product not found");
      router.push('/admin/products');
    }
    setIsLoading(false);
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setProduct(prev => ({ ...prev, images: [...prev.images, imageUrl.trim()] }));
      setImageUrl('');
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setProduct(prev => ({ 
      ...prev, 
      images: prev.images.filter((_, idx) => idx !== indexToRemove) 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const supabase = createClient();
    const productData = {
      name: product.name,
      description: product.description || null,
      price: parseFloat(product.price),
      stock: parseInt(product.stock) || 0,
      category: product.category,
      subcategory: product.subcategory || null,
      images: product.images.length > 0 ? product.images : ['https://placehold.co/600x800?text=No+Image'],
      sizes: product.sizes,
      colors: product.colors
    };

    if (isNew) {
      const { error } = await supabase.from('products').insert([productData]);
      if (error) {
        alert('Failed to add product: ' + error.message);
      } else {
        alert('Product added successfully!');
        router.push('/admin/products');
      }
    } else {
      const { error } = await supabase.from('products').update(productData).eq('id', id);
      if (error) {
        alert('Failed to update product: ' + error.message);
      } else {
        alert('Product updated successfully!');
        router.push('/admin/products');
      }
    }
    setIsSubmitting(false);
  };

  if (isLoading) return <div className={styles.container}>Loading product data...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/admin/products" className={styles.backBtn}>
          <ArrowLeft size={18} /> Back to Products
        </Link>
        <div className={styles.titleWrapper}>
          <h1 className={styles.title}>{isNew ? 'Add New Product' : 'Edit Product'}</h1>
          <p className={styles.subtitle}>{isNew ? 'Fill in the details to publish a new product.' : 'Update the details of this product.'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.formLayout}>
        <div className={styles.mainColumn}>
          <div className={styles.card}>
            <h3>Basic Information</h3>
            <div className={styles.formGroup}>
              <label>Product Name *</label>
              <input type="text" name="name" value={product.name} onChange={handleChange} placeholder="e.g. Royal Emerald Thobe" required />
            </div>
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea name="description" value={product.description || ''} onChange={handleChange} rows="5" placeholder="Detailed product description..."></textarea>
            </div>
          </div>

          <div className={styles.card}>
            <h3>Media (Image URLs)</h3>
            <div className={styles.formGroup}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="url" 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)} 
                  placeholder="https://example.com/image.jpg" 
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={handleAddImage} className={styles.publishBtn} style={{ width: 'auto', padding: '0 1rem' }}>Add URL</button>
              </div>
            </div>
            <div className={styles.imageGallery} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '1rem' }}>
              {product.images.map((img, idx) => (
                <div key={idx} style={{ position: 'relative', width: '100px', height: '120px' }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                  <button type="button" onClick={() => handleRemoveImage(idx)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer', padding: '2px' }}>
                    <X size={14} color="red" />
                  </button>
                </div>
              ))}
            </div>
            {product.images.length === 0 && (
              <div className={styles.uploadBox}>
                <UploadCloud size={40} className={styles.uploadIcon} />
                <p>No images added yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.sideColumn}>
          <div className={styles.card}>
            <h3>Pricing & Inventory</h3>
            <div className={styles.formGroup}>
              <label>Price (USD) *</label>
              <input type="number" name="price" value={product.price} onChange={handleChange} placeholder="0.00" required />
            </div>
            <div className={styles.formGroup}>
              <label>Stock Quantity</label>
              <input type="number" name="stock" value={product.stock} onChange={handleChange} placeholder="10" />
            </div>
          </div>

          <div className={styles.card}>
            <h3>Organization</h3>
            <div className={styles.formGroup}>
              <label>Category *</label>
              <select name="category" value={product.category} onChange={handleChange} required>
                <option value="">Select Category</option>
                <option value="Menswear">Menswear</option>
                <option value="Womenswear">Womenswear</option>
                <option value="Kids">Kids</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Subcategory</label>
              <input type="text" name="subcategory" value={product.subcategory || ''} onChange={handleChange} placeholder="e.g. Panjabi" />
            </div>
          </div>

          <div className={styles.actionCard}>
            <button type="button" className={styles.discardBtn} onClick={() => router.push('/admin/products')}>Discard</button>
            <button type="submit" className={styles.publishBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (isNew ? 'Publish Product' : 'Update Product')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
