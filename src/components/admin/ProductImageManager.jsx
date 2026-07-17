"use client";
import { ImagePlus, MoveDown, MoveUp, Trash2, UploadCloud } from 'lucide-react';
import styles from '@/app/admin/products/new/page.module.css';

export default function ProductImageManager({
  images,
  setImages,
  productName = '',
  setErrorMessage,
}) {
  const uploadImages = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('productName', productName || 'product');

    try {
      const response = await fetch('/api/admin/uploads/product-images', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to upload images.');
      }

      setImages((current) => [
        ...current,
        ...data.images.map((image) => ({ url: image.url, path: image.path })),
      ]);
    } catch (error) {
      setErrorMessage?.(error.message);
    } finally {
      event.target.value = '';
    }
  };

  const removeImage = async (image) => {
    setImages((current) => current.filter((item) => item.url !== image.url));

    if (image.path) {
      await fetch('/api/admin/uploads/product-images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: image.path }),
      }).catch(() => null);
    }
  };

  const moveImage = (index, direction) => {
    setImages((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const addUrl = () => {
    const url = window.prompt('Paste image URL');
    if (!url) return;
    setImages((current) => [...current, { url: url.trim(), path: '' }]);
  };

  return (
    <div>
      <div className={styles.uploadBox}>
        <UploadCloud size={40} className={styles.uploadIcon} />
        <p>Upload product images</p>
        <span>JPG, PNG, WEBP, or GIF. Up to 5MB each.</span>
        <div className={styles.imageActions}>
          <label className={styles.imageUploadBtn}>
            <ImagePlus size={16} />
            Select Images
            <input type="file" accept="image/*" multiple onChange={uploadImages} />
          </label>
          <button type="button" className={styles.imageUrlBtn} onClick={addUrl}>
            Add URL
          </button>
          <a href="/admin/media" target="_blank" rel="noopener noreferrer" className={styles.imageUrlBtn}>
            Image Library
          </a>
        </div>
      </div>

      <div className={styles.imageGrid}>
        {images.length === 0 ? (
          <p className={styles.emptyImages}>No images added yet.</p>
        ) : images.map((image, index) => (
          <div key={`${image.url}-${index}`} className={styles.imageTile}>
            <img src={image.url} alt={`Product image ${index + 1}`} />
            <div className={styles.imageTileMeta}>
              <span>{index === 0 ? 'Primary' : `Image ${index + 1}`}</span>
              <div className={styles.imageTileActions}>
                <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} title="Move up">
                  <MoveUp size={14} />
                </button>
                <button type="button" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} title="Move down">
                  <MoveDown size={14} />
                </button>
                <button type="button" onClick={() => removeImage(image)} title="Remove">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
