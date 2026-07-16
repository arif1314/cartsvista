"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/format/currency';
import styles from './page.module.css';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/products');
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to load products.');
      }
      setProducts(data.products || []);
    } catch (error) {
      alert(error.message);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Unable to archive product.');
        }
        setProducts(products.filter(p => p.id !== id));
      } catch (error) {
        alert('Failed to archive product. Details: ' + error.message);
      }
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All Categories' || p.category?.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Products</h1>
          <p className={styles.subtitle}>Manage your store catalog</p>
        </div>
        <Link href="/admin/products/new" className={styles.addBtn}>
          <Plus size={18} /> Add New Product
        </Link>
      </div>

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search products..." 
              className={styles.searchInput} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className={styles.filters}>
            <select 
              className={styles.select}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option>All Categories</option>
              <option>Menswear</option>
              <option>Womenswear</option>
            </select>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading products...</td>
                </tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <tr key={product.id}>
                    <td>
                      <div className={styles.productCell}>
                        <img src={product.image || (product.images && product.images[0])} alt={product.name} className={styles.productImg} />
                        <span className={styles.productName}>{product.name}</span>
                      </div>
                    </td>
                    <td><span className={styles.categoryBadge}>{product.category}</span></td>
                    <td className={styles.price}>{formatCurrency(product.price)}</td>
                    <td>
                      <span className={`${styles.stockBadge} ${styles.inStock}`}>In Stock</span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link href={`/admin/products/${product.id}/edit`} className={styles.actionBtn} title="Edit">
                          <Edit2 size={16} />
                        </Link>
                        <button 
                          className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                          title="Delete"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
