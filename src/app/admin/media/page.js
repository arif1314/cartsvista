"use client";

import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, ImagePlus, RefreshCw, Search, Trash2, UploadCloud } from 'lucide-react';
import styles from './page.module.css';

function formatSize(bytes) {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminMediaPage() {
  const [files, setFiles] = useState([]);
  const [query, setQuery] = useState('');
  const [folder, setFolder] = useState('library');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [copiedPath, setCopiedPath] = useState('');

  async function loadFiles() {
    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/media');
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load image library.');
      setFiles(data.files || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadFiles();
  }, []);

  const filteredFiles = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return files;
    return files.filter((file) => (
      file.name?.toLowerCase().includes(search)
      || file.path?.toLowerCase().includes(search)
      || file.type?.toLowerCase().includes(search)
    ));
  }, [files, query]);

  async function uploadFiles(event) {
    const selected = Array.from(event.target.files || []);
    if (selected.length === 0) return;

    const formData = new FormData();
    selected.forEach((file) => formData.append('files', file));
    formData.append('folder', folder || 'library');

    setIsUploading(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/media', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to upload images.');
      setFiles((current) => [...(data.files || []), ...current]);
      setMessage(`${data.files?.length || selected.length} image uploaded.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  }

  async function copyUrl(file) {
    try {
      await navigator.clipboard.writeText(file.url);
      setCopiedPath(file.path);
      setTimeout(() => setCopiedPath(''), 1800);
    } catch {
      window.prompt('Copy image URL', file.url);
    }
  }

  async function deleteFile(file) {
    if (!confirm('Delete this image from storage? Products using this URL may stop showing the image.')) return;

    try {
      const response = await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: file.path }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to delete image.');
      setFiles((current) => current.filter((item) => item.path !== file.path));
      setMessage('Image deleted.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Image Library</h1>
          <p className={styles.subtitle}>Upload images once, copy their links, and reuse them for products, logos, pages, and campaigns.</p>
        </div>
        <button type="button" className={styles.refreshBtn} onClick={loadFiles} disabled={isLoading}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className={styles.uploadCard}>
        <div className={styles.uploadIntro}>
          <UploadCloud size={34} />
          <div>
            <h2>Upload Images</h2>
            <p>JPG, PNG, WEBP, GIF, or SVG. Keep files small to protect your Supabase storage quota.</p>
          </div>
        </div>
        <div className={styles.uploadControls}>
          <input
            type="text"
            value={folder}
            onChange={(event) => setFolder(event.target.value)}
            placeholder="Folder name"
            className={styles.folderInput}
          />
          <label className={styles.uploadBtn}>
            <ImagePlus size={16} />
            {isUploading ? 'Uploading...' : 'Select Images'}
            <input type="file" accept="image/*" multiple onChange={uploadFiles} disabled={isUploading} />
          </label>
        </div>
      </div>

      {message && <div className={styles.message}>{message}</div>}

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by file name, folder, or type..."
          />
        </div>
        <span className={styles.count}>{filteredFiles.length} images</span>
      </div>

      {isLoading ? (
        <div className={styles.emptyState}>Loading image library...</div>
      ) : filteredFiles.length === 0 ? (
        <div className={styles.emptyState}>No images found.</div>
      ) : (
        <div className={styles.grid}>
          {filteredFiles.map((file) => (
            <div className={styles.card} key={file.path}>
              <div className={styles.preview}>
                <img src={file.url} alt={file.name || file.path} />
              </div>
              <div className={styles.meta}>
                <strong title={file.path}>{file.name || file.path.split('/').pop()}</strong>
                <span>{file.path}</span>
                <small>{formatSize(file.size)}{file.type ? ` • ${file.type}` : ''}</small>
              </div>
              <div className={styles.actions}>
                <button type="button" onClick={() => copyUrl(file)}>
                  {copiedPath === file.path ? <Check size={15} /> : <Copy size={15} />}
                  {copiedPath === file.path ? 'Copied' : 'Copy URL'}
                </button>
                <button type="button" className={styles.deleteBtn} onClick={() => deleteFile(file)}>
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
