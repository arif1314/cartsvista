"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UploadCloud } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';
import styles from './page.module.css';

export default function AddProduct() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.target);
    const newProduct = {
      name: formData.get('name'),
      description: formData.get('description') || null,
      price: parseFloat(formData.get('price')),
      stock: parseInt(formData.get('stock')) || 0,
      category: formData.get('category'),
      subcategory: formData.get('subcategory') || null,
      images: ['https://images.unsplash.com/photo-1593030103066-0093718efeb9?q=80&w=600&auto=format&fit=crop'], // Mocked image for now
      sizes: ['S', 'M', 'L'], // Mocked sizes
      colors: []
    };

    const { error } = await supabase.from('products').insert(newProduct);
    
    if (error) {
      alert('Failed to add product (DB Error): ' + error.message);
      setIsSubmitting(false);
    } else {
      alert('Product added successfully!');
      router.push('/admin/products');
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
          <div className={styles.card}>
            <h3>Basic Information</h3>
            <div className={styles.formGroup}>
              <label>Product Name *</label>
              <input type="text" name="name" placeholder="e.g. Royal Emerald Thobe" required />
            </div>
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea name="description" rows="5" placeholder="Detailed product description..."></textarea>
            </div>
          </div>

          <div className={styles.card}>
            <h3>Media</h3>
            <div className={styles.uploadBox}>
              <UploadCloud size={40} className={styles.uploadIcon} />
              <p>Drag and drop your images here</p>
              <span>or click to browse from your computer</span>
              <button type="button" className={styles.browseBtn}>Browse Files</button>
            </div>
          </div>
        </div>

        <div className={styles.sideColumn}>
          <div className={styles.card}>
            <h3>Pricing & Inventory</h3>
            <div className={styles.formGroup}>
              <label>Price (BDT) *</label>
              <input type="number" name="price" placeholder="0.00" required />
            </div>
            <div className={styles.formGroup}>
              <label>Stock Quantity</label>
              <input type="number" name="stock" placeholder="10" />
            </div>
          </div>

          <div className={styles.card}>
            <h3>Organization</h3>
            <div className={styles.formGroup}>
              <label>Category *</label>
              <select name="category" required>
                <option value="">Select Category</option>
                <option value="Menswear">Menswear</option>
                <option value="Womenswear">Womenswear</option>
                <option value="Kids">Kids</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Subcategory</label>
              <input type="text" name="subcategory" placeholder="e.g. Panjabi" />
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
