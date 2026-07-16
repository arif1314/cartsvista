"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  RefreshCw, 
  Check, 
  ImageIcon, 
  FileText, 
  Link2, 
  Clock,
  Calendar
} from 'lucide-react';
import styles from './page.module.css';

export default function AdminBlogPage() {
  const [articles, setArticles] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({
    title: '',
    summary: '',
    reading_time: '4 min read',
    cover_image: '',
    related_link: '',
    content: ''
  });

  const [success, setSuccess] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchArticles = async () => {
    setIsLoaded(false);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setArticles(data);
    }
    setIsLoaded(true);
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  if (!isLoaded) {
    return (
      <div className={styles.loading}>
        <RefreshCw size={24} className={styles.spinner} />
        Loading blog articles...
      </div>
    );
  }

  const handleEditClick = (article) => {
    setEditingId(article.id);
    setForm({
      title: article.title || '',
      summary: article.summary || '',
      reading_time: article.reading_time || '4 min read',
      cover_image: article.cover_image || '',
      related_link: article.related_link || '',
      content: article.content || ''
    });
    setSuccess(false);
  };

  const handleNewClick = () => {
    setEditingId(null);
    setForm({
      title: '',
      summary: '',
      reading_time: '4 min read',
      cover_image: '',
      related_link: '',
      content: ''
    });
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const supabase = createClient();
    
    // Create slug
    const slug = form.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const articleData = {
      ...form,
      slug,
      is_published: true,
      updated_at: new Date().toISOString()
    };

    if (editingId) {
      const { error } = await supabase
        .from('articles')
        .update(articleData)
        .eq('id', editingId);
      
      if (!error) {
        setMsg("Article updated successfully!");
        setSuccess(true);
        fetchArticles();
      } else {
        alert("Failed to update article.");
      }
    } else {
      const { error } = await supabase
        .from('articles')
        .insert([{ ...articleData, created_at: new Date().toISOString() }]);
        
      if (!error) {
        setMsg("New article published successfully!");
        setSuccess(true);
        handleNewClick();
        fetchArticles();
      } else {
        alert("Failed to publish article.");
      }
    }
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this article? This action cannot be undone.")) {
      const supabase = createClient();
      const { error } = await supabase.from('articles').delete().eq('id', id);
      
      if (!error) {
        if (editingId === id) handleNewClick();
        fetchArticles();
      } else {
        alert("Failed to delete article.");
      }
    }
  };

  const handleReset = () => {
    fetchArticles();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Editorial Blog Management</h1>
          <p className={styles.pageSubtitle}>Write styling guides, collection notes, and fashion diaries to engage visitors.</p>
        </div>
        <button className={styles.resetBtn} onClick={handleReset}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className={styles.mainLayout}>
        {/* Left Side: Article List */}
        <div className={styles.listSection}>
          <div className={styles.sectionHeaderRow}>
            <h2 className={styles.sectionTitle}>Articles ({articles.length})</h2>
            <button className={styles.addBtn} onClick={handleNewClick}>
              <Plus size={16} /> New Article
            </button>
          </div>

          <div className={styles.articlesList}>
            {articles.map((art) => {
              const isEditing = editingId === art.id;
              const dateObj = new Date(art.created_at);
              const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              return (
                <div 
                  key={art.id}
                  className={`${styles.articleListItem} ${isEditing ? styles.itemEditing : ''}`}
                >
                  <div className={styles.thumbnailWrapper}>
                    <img src={art.cover_image} alt={art.title} className={styles.thumbnail} />
                  </div>
                  <div className={styles.itemInfo}>
                    <h3 className={styles.itemTitle}>{art.title}</h3>
                    <p className={styles.itemMeta}>{formattedDate} • {art.reading_time}</p>
                  </div>
                  <div className={styles.itemActions}>
                    <button 
                      type="button"
                      onClick={() => handleEditClick(art)}
                      className={`${styles.actionBtn} ${styles.editBtn}`}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDelete(art.id)}
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
            {articles.length === 0 && (
              <div className={styles.emptyList}>
                No articles yet. Click "New Article" to write one!
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Form Editor */}
        <div className={styles.editorSection}>
          <div className={styles.editorHeader}>
            <h2>{editingId ? 'Edit Article' : 'Write New Article'}</h2>
            <p>{editingId ? `Article ID: ${editingId.substring(0,8)}...` : 'Share a styling guide or fashion news'}</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <FileText size={16} /> Article Title
              </label>
              <input 
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="e.g. How to Care for Premium Nidha Abayas"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <ImageIcon size={16} /> Cover Image URL
              </label>
              <input 
                type="text"
                value={form.cover_image}
                onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
                required
                placeholder="https://images.unsplash.com/photo-..."
                className={styles.input}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <Clock size={16} /> Reading Time
                </label>
                <input 
                  type="text"
                  value={form.reading_time}
                  onChange={(e) => setForm({ ...form, reading_time: e.target.value })}
                  required
                  placeholder="e.g. 4 min read"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <Link2 size={16} /> Related Collection Link (Shop redirection)
                </label>
                <input 
                  type="text"
                  value={form.related_link}
                  onChange={(e) => setForm({ ...form, related_link: e.target.value })}
                  placeholder="e.g. /c/women"
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <FileText size={16} /> Short Summary
              </label>
              <input 
                type="text"
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                required
                placeholder="Brief sentence to summarize the article in cards..."
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <FileText size={16} /> Body Content (HTML Allowed)
              </label>
              <textarea 
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                required
                rows={12}
                placeholder="<p>Use paragraph tags for text.</p> <h3>Use h3 tags for section headers.</h3> <ul><li>Bullet points</li></ul>"
                className={styles.textarea}
              />
            </div>

            <div className={styles.formActionsRow}>
              <button type="submit" className={styles.submitBtn}>
                <Save size={18} />
                {editingId ? 'Save and Publish Changes' : 'Publish Article'}
              </button>
              {editingId && (
                <button type="button" className={styles.cancelBtn} onClick={handleNewClick}>
                  Cancel Edit
                </button>
              )}
              {success && (
                <div className={styles.successBadge}>
                  <Check size={16} />
                  {msg}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
