"use client";
import { useEffect, useState } from 'react';
import { Edit2, Plus, Power, Trash2 } from 'lucide-react';
import styles from '../categories/page.module.css';

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState([]);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', slug: '', logoUrl: '' });

  async function loadBrands() {
    try {
      const response = await fetch('/api/admin/brands');
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load brands.');
      setBrands(data.brands || []);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadBrands();
  }, []);

  const createBrand = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      const response = await fetch('/api/admin/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to create brand.');
      setForm({ name: '', slug: '', logoUrl: '' });
      await loadBrands();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const updateBrand = async (id, patch) => {
    try {
      const response = await fetch(`/api/admin/brands/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to update brand.');
      await loadBrands();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const deleteBrand = async (id) => {
    if (!confirm('Archive this brand? Products will not be deleted.')) return;
    try {
      const response = await fetch(`/api/admin/brands/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to archive brand.');
      await loadBrands();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const editBrand = async (brand) => {
    const name = window.prompt('Brand name', brand.name);
    if (!name) return;
    const slug = window.prompt('Brand slug', brand.slug);
    if (!slug) return;
    const logoUrl = window.prompt('Logo URL', brand.logoUrl || '') || '';
    await updateBrand(brand.id, { name, slug, logoUrl });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Brands</h1>
          <p className={styles.subtitle}>Manage product brands used across the catalog.</p>
        </div>
      </div>

      {message && <p className={styles.message}>{message}</p>}

      <div className={styles.grid}>
        <div className={styles.formsColumn}>
          <div className={styles.card}>
            <h3>Add Brand</h3>
            <p className={styles.cardDesc}>Create a brand that can be selected on product forms.</p>
            <form className={styles.form} onSubmit={createBrand}>
              <div className={styles.formGroup}>
                <label>Name</label>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    name: event.target.value,
                    slug: current.slug ? current.slug : slugify(event.target.value),
                  }))}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Slug</label>
                <input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))} required />
              </div>
              <div className={styles.formGroup}>
                <label>Logo URL</label>
                <input type="url" value={form.logoUrl} onChange={(event) => setForm((current) => ({ ...current, logoUrl: event.target.value }))} />
              </div>
              <button className={styles.addBtn}>
                <Plus size={16} /> Save Brand
              </button>
            </form>
          </div>
        </div>

        <div className={styles.previewColumn}>
          <div className={styles.card}>
            <h3>Brand List</h3>
            <p className={styles.cardDesc}>Inactive brands stay in history but disappear from product selectors.</p>
            <div className={styles.categoryList}>
              {brands.length === 0 ? (
                <p className={styles.emptySub}>No brands created yet.</p>
              ) : brands.map((brand) => (
                <div key={brand.id} className={styles.categoryItem}>
                  <div className={styles.categoryHeader}>
                    <div>
                      <h4>{brand.name}</h4>
                      <span className={styles.slug}>{brand.slug}</span>
                    </div>
                    <div className={styles.actions}>
                      <button className={styles.deleteBtn} onClick={() => editBrand(brand)} title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button className={styles.deleteBtn} onClick={() => updateBrand(brand.id, { isActive: !brand.isActive })} title={brand.isActive ? 'Deactivate' : 'Activate'}>
                        <Power size={16} />
                      </button>
                      <button className={styles.deleteBtn} onClick={() => deleteBrand(brand.id)} title="Archive">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {brand.logoUrl ? <p className={styles.emptySub}>{brand.logoUrl}</p> : <p className={styles.emptySub}>No logo URL.</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
