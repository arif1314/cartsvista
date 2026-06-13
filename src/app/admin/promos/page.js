"use client";

import { useState } from 'react';
import { usePromos } from '@/context/PromoContext';
import { 
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Edit2,
  Save,
  RefreshCw,
  Check,
  ImageIcon,
  FileText,
  Link2,
  Layers,
  LayoutGrid,
  Tag,
  Percent
} from 'lucide-react';
import styles from './page.module.css';

export default function AdminPromosPage() {
  const { 
    slides, 
    promo2, 
    promo3, 
    promo4, 
    lookbooks,
    addSlide, 
    updateSlide, 
    deleteSlide, 
    moveSlide, 
    updateStaticPromo, 
    addLook,
    updateLook,
    deleteLook,
    resetPromos 
  } = usePromos();

  const [activeTab, setActiveTab] = useState('slider'); // 'slider', 'static', or 'lookbook'
  
  // Slide Form State
  const [editingSlideId, setEditingId] = useState(null); // null means adding new slide
  const [slideForm, setSlideForm] = useState({
    title: '',
    subtitle: '',
    buttonText: 'Shop Collection',
    image: '',
    link: ''
  });

  // Static Promo Form State
  const [selectedStaticId, setSelectedStaticId] = useState('promo2'); // promo2, promo3, promo4
  const [staticForm, setStaticForm] = useState({
    image: '',
    title: '',
    subtitle: '',
    badge: '',
    percentage: '',
    link: ''
  });

  // Lookbook Form State
  const [editingLookId, setEditingLookId] = useState(null); // null means adding new look
  const [lookForm, setLookForm] = useState({
    title: '',
    subtitle: '',
    tag: '',
    fabric: '',
    image: '',
    link: ''
  });

  const [success, setSuccess] = useState(false);
  const [msg, setMsg] = useState('');

  // Handle slide/look inputs
  const handleInputChange = (field, value) => {
    setSlideForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLookInputChange = (field, value) => {
    setLookForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Initializing static form values when selected
  const handleSelectStatic = (id) => {
    setSelectedStaticId(id);
    const promo = id === 'promo2' ? promo2 : id === 'promo3' ? promo3 : promo4;
    setStaticForm({
      image: promo.image || '',
      title: promo.title || '',
      subtitle: promo.subtitle || '',
      badge: promo.badge || '',
      percentage: promo.percentage || '',
      link: promo.link || ''
    });
    setSuccess(false);
  };

  // Handle slide select for editing
  const handleEditSlideClick = (slide) => {
    setEditingId(slide.id);
    setFormFromSlide(slide);
    setSuccess(false);
  };

  const setFormFromSlide = (slide) => {
    setForm({
      title: slide.title,
      subtitle: slide.subtitle,
      buttonText: slide.buttonText || 'Shop Collection',
      image: slide.image,
      link: slide.link
    });
  };

  const setForm = (val) => {
    setSlideForm(val);
  };

  // Form submits
  const handleSlideSubmit = (e) => {
    e.preventDefault();
    if (editingSlideId) {
      updateSlide(editingSlideId, slideForm);
      setMsg("Campaign slide updated!");
    } else {
      addSlide(slideForm);
      setMsg("New campaign slide added!");
      setSlideForm({
        title: '',
        subtitle: '',
        buttonText: 'Shop Collection',
        image: '',
        link: ''
      });
    }
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleStaticSubmit = (e) => {
    e.preventDefault();
    updateStaticPromo(selectedStaticId, staticForm);
    setMsg(`Static Slot ${selectedStaticId.replace('promo', '')} updated!`);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleAddNewSlide = () => {
    setEditingId(null);
    setForm({
      title: '',
      subtitle: '',
      buttonText: 'Shop Collection',
      image: '',
      link: ''
    });
    setSuccess(false);
  };

  const handleDeleteSlide = (id) => {
    if (confirm("Are you sure you want to delete this slide from the campaign?")) {
      deleteSlide(id);
      if (editingSlideId === id) {
        handleAddNewSlide();
      }
    }
  };

  // Lookbook handlers
  const handleEditLookClick = (look) => {
    setEditingLookId(look.id);
    setLookForm({
      title: look.title || '',
      subtitle: look.subtitle || '',
      tag: look.tag || '',
      fabric: look.fabric || '',
      image: look.image || '',
      link: look.link || ''
    });
    setSuccess(false);
  };

  const handleAddNewLook = () => {
    setEditingLookId(null);
    setLookForm({
      title: '',
      subtitle: '',
      tag: '',
      fabric: '',
      image: '',
      link: ''
    });
    setSuccess(false);
  };

  const handleLookSubmit = (e) => {
    e.preventDefault();
    if (editingLookId) {
      updateLook(editingLookId, lookForm);
      setMsg("Lookbook item updated!");
    } else {
      addLook(lookForm);
      setMsg("New lookbook item added!");
      setLookForm({
        title: '',
        subtitle: '',
        tag: '',
        fabric: '',
        image: '',
        link: ''
      });
    }
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleDeleteLook = (id) => {
    if (confirm("Are you sure you want to delete this lookbook item?")) {
      deleteLook(id);
      if (editingLookId === id) {
        handleAddNewLook();
      }
    }
  };

  const handleResetAll = () => {
    if (confirm("Are you sure you want to reset all promotions (slideshow, static, and lookbook) to defaults?")) {
      resetPromos();
      handleAddNewSlide();
      handleAddNewLook();
      setTimeout(() => {
        handleSelectStatic('promo2');
      }, 50);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Homepage Promotions</h1>
          <p className={styles.pageSubtitle}>Customize the Campaign Slideshow (Left Slot 1) and the Static Banners (Right Slots 2, 3, and 4).</p>
        </div>
        <button className={styles.resetBtn} onClick={handleResetAll}>
          <RefreshCw size={16} />
          Reset All Banners
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabContainer}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'slider' ? styles.activeTab : ''}`}
          onClick={() => { setActiveTab('slider'); setSuccess(false); }}
        >
          <Layers size={16} />
          Hero Slideshow (Left Slot 1)
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'static' ? styles.activeTab : ''}`}
          onClick={() => { 
            setActiveTab('static'); 
            handleSelectStatic(selectedStaticId); 
            setSuccess(false); 
          }}
        >
          <LayoutGrid size={16} />
          Static Banners (Right Slots 2, 3, 4)
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'lookbook' ? styles.activeTab : ''}`}
          onClick={() => { 
            setActiveTab('lookbook'); 
            handleAddNewLook();
            setSuccess(false); 
          }}
        >
          <Tag size={16} />
          Style Guide (Lookbook)
        </button>
      </div>

      {activeTab === 'slider' && (
        <div className={styles.mainLayout}>
          {/* Left Side: Active Slides */}
          <div className={styles.listSection}>
            <div className={styles.sectionHeaderRow}>
              <h2 className={styles.sectionTitle}>Campaign Slides ({slides.length})</h2>
              <button className={styles.addBtn} onClick={handleAddNewSlide}>
                <Plus size={16} /> New Slide
              </button>
            </div>

            <div className={styles.slidesList}>
              {slides.map((slide, index) => {
                const isEditing = editingSlideId === slide.id;
                return (
                  <div 
                    key={slide.id}
                    className={`${styles.slideListItem} ${isEditing ? styles.itemEditing : ''}`}
                  >
                    <div className={styles.thumbnailWrapper}>
                      <img src={slide.image} alt={slide.title} className={styles.thumbnail} />
                    </div>
                    <div className={styles.itemInfo}>
                      <h3 className={styles.itemTitle}>{slide.title}</h3>
                      <p className={styles.itemSubtitle}>{slide.subtitle || 'No subtitle'}</p>
                    </div>
                    <div className={styles.itemActions}>
                      <div className={styles.sortingArrows}>
                        <button 
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveSlide(index, 'up')}
                          className={styles.sortBtn}
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button 
                          type="button"
                          disabled={index === slides.length - 1}
                          onClick={() => moveSlide(index, 'down')}
                          className={styles.sortBtn}
                        >
                          <ArrowDown size={12} />
                        </button>
                      </div>

                      <button 
                        type="button"
                        onClick={() => handleEditSlideClick(slide)}
                        className={`${styles.actionBtn} ${styles.editBtn}`}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDeleteSlide(slide.id)}
                        disabled={slides.length <= 1}
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side: Form Editor */}
          <div className={styles.editorSection}>
            <div className={styles.editorHeader}>
              <h2>{editingSlideId ? 'Edit Campaign Slide' : 'Create Campaign Slide'}</h2>
              <p>{editingSlideId ? `Slide ID: ${editingSlideId}` : 'Add a slide to the transition list'}</p>
            </div>

            <form onSubmit={handleSlideSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <ImageIcon size={16} /> Background Image URL
                </label>
                <input 
                  type="text"
                  value={slideForm.image}
                  onChange={(e) => handleInputChange('image', e.target.value)}
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <FileText size={16} /> Campaign Title
                </label>
                <input 
                  type="text"
                  value={slideForm.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                  placeholder="e.g. SUMMER ARRIVALS 2026"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <FileText size={16} /> Subheading / Subtitle
                </label>
                <input 
                  type="text"
                  value={slideForm.subtitle}
                  onChange={(e) => handleInputChange('subtitle', e.target.value)}
                  placeholder="e.g. CartsVista Exclusives"
                  className={styles.input}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <FileText size={16} /> Button Text
                  </label>
                  <input 
                    type="text"
                    value={slideForm.buttonText}
                    onChange={(e) => handleInputChange('buttonText', e.target.value)}
                    placeholder="e.g. Shop Now"
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <Link2 size={16} /> Destination Link URL
                  </label>
                  <input 
                    type="text"
                    value={slideForm.link}
                    onChange={(e) => handleInputChange('link', e.target.value)}
                    placeholder="e.g. /c/menswear"
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formActionsRow}>
                <button type="submit" className={styles.submitBtn}>
                  <Save size={18} />
                  {editingSlideId ? 'Save Campaign Slide' : 'Add Slide'}
                </button>
                {editingSlideId && (
                  <button type="button" className={styles.cancelBtn} onClick={handleAddNewSlide}>
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
      )}

      {activeTab === 'static' && (
        <div className={styles.mainLayout}>
          {/* Left Side: Right Slots select */}
          <div className={styles.listSection}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              Select Static Slot
            </h2>
            <div className={styles.staticSlotsList}>
              {[
                { id: 'promo2', label: 'Slot 2 (Top Right)', details: promo2 },
                { id: 'promo3', label: 'Slot 3 (Bottom Right Left)', details: promo3 },
                { id: 'promo4', label: 'Slot 4 (Bottom Right Right)', details: promo4 }
              ].map((slot) => {
                const isSelected = selectedStaticId === slot.id;
                return (
                  <div 
                    key={slot.id}
                    className={`${styles.staticSlotItem} ${isSelected ? styles.itemEditing : ''}`}
                    onClick={() => handleSelectStatic(slot.id)}
                  >
                    <div className={styles.thumbnailWrapper}>
                      <img src={slot.details?.image} alt={slot.details?.title} className={styles.thumbnail} />
                    </div>
                    <div className={styles.itemInfo}>
                      <h3 className={styles.itemTitle}>{slot.label}</h3>
                      <p className={styles.itemSubtitle}>{slot.details?.title}</p>
                    </div>
                    {isSelected && <span className={styles.activeIndicator}>Selected</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side: Form Editor for selected static slot */}
          <div className={styles.editorSection}>
            <div className={styles.editorHeader}>
              <h2>Edit Static Banner (Slot {selectedStaticId.replace('promo', '')})</h2>
              <p>Customize the static image and descriptions for this placement.</p>
            </div>

            <form onSubmit={handleStaticSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <ImageIcon size={16} /> Image URL
                </label>
                <input 
                  type="text"
                  value={staticForm.image}
                  onChange={(e) => setStaticForm({ ...staticForm, image: e.target.value })}
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <FileText size={16} /> Banner Title
                </label>
                <input 
                  type="text"
                  value={staticForm.title}
                  onChange={(e) => setStaticForm({ ...staticForm, title: e.target.value })}
                  required
                  placeholder="e.g. FLASH SALE"
                  className={styles.input}
                />
              </div>

              {selectedStaticId !== 'promo4' && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <FileText size={16} /> Subheading / Subtitle
                  </label>
                  <input 
                    type="text"
                    value={staticForm.subtitle}
                    onChange={(e) => setStaticForm({ ...staticForm, subtitle: e.target.value })}
                    placeholder="e.g. MID-SUMMER"
                    className={styles.input}
                  />
                </div>
              )}

              {selectedStaticId === 'promo2' && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <Layers size={16} /> Badge Label
                  </label>
                  <input 
                    type="text"
                    value={staticForm.badge}
                    onChange={(e) => setStaticForm({ ...staticForm, badge: e.target.value })}
                    placeholder="e.g. EXCLUSIVELY ONLINE"
                    className={styles.input}
                  />
                </div>
              )}

              {selectedStaticId === 'promo3' && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <Percent size={16} /> Discount Label
                  </label>
                  <input 
                    type="text"
                    value={staticForm.percentage}
                    onChange={(e) => setStaticForm({ ...staticForm, percentage: e.target.value })}
                    placeholder="e.g. 20% OFF"
                    className={styles.input}
                  />
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <Link2 size={16} /> Redirection Path (Link)
                </label>
                <input 
                  type="text"
                  value={staticForm.link}
                  onChange={(e) => setStaticForm({ ...staticForm, link: e.target.value })}
                  placeholder="e.g. /c/womenswear"
                  className={styles.input}
                />
              </div>

              <div className={styles.formActionsRow}>
                <button type="submit" className={styles.submitBtn}>
                  <Save size={18} />
                  Save Slot {selectedStaticId.replace('promo', '')} Config
                </button>
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
      )}

      {activeTab === 'lookbook' && (
        <div className={styles.mainLayout}>
          {/* Left Side: Active Looks */}
          <div className={styles.listSection}>
            <div className={styles.sectionHeaderRow}>
              <h2 className={styles.sectionTitle}>Style Guide Looks ({lookbooks.length})</h2>
              <button className={styles.addBtn} onClick={handleAddNewLook}>
                <Plus size={16} /> New Look
              </button>
            </div>

            <div className={styles.slidesList}>
              {lookbooks.map((look) => {
                const isEditing = editingLookId === look.id;
                return (
                  <div 
                    key={look.id}
                    className={`${styles.slideListItem} ${isEditing ? styles.itemEditing : ''}`}
                  >
                    <div className={styles.thumbnailWrapper}>
                      <img src={look.image} alt={look.title} className={styles.thumbnail} />
                    </div>
                    <div className={styles.itemInfo}>
                      <h3 className={styles.itemTitle}>{look.title}</h3>
                      <p className={styles.itemSubtitle}>
                        {look.subtitle || 'No subtitle'} • <span className={styles.lookTagBadge}>{look.tag}</span>
                      </p>
                    </div>
                    <div className={styles.itemActions}>
                      <button 
                        type="button"
                        onClick={() => handleEditLookClick(look)}
                        className={`${styles.actionBtn} ${styles.editBtn}`}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDeleteLook(look.id)}
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {lookbooks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--secondary)' }}>
                  No lookbook items yet. Click "New Look" to add one.
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Form Editor */}
          <div className={styles.editorSection}>
            <div className={styles.editorHeader}>
              <h2>{editingLookId ? 'Edit Lookbook Item' : 'Create Lookbook Item'}</h2>
              <p>{editingLookId ? `Look ID: ${editingLookId}` : 'Add a styling inspiration item'}</p>
            </div>

            <form onSubmit={handleLookSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <ImageIcon size={16} /> Image URL
                </label>
                <input 
                  type="text"
                  value={lookForm.image}
                  onChange={(e) => handleLookInputChange('image', e.target.value)}
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <FileText size={16} /> Look Title
                </label>
                <input 
                  type="text"
                  value={lookForm.title}
                  onChange={(e) => handleLookInputChange('title', e.target.value)}
                  required
                  placeholder="e.g. Festive Elegance"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <FileText size={16} /> Subtitle / Theme
                </label>
                <input 
                  type="text"
                  value={lookForm.subtitle}
                  onChange={(e) => handleLookInputChange('subtitle', e.target.value)}
                  placeholder="e.g. Traditional Heritage"
                  className={styles.input}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <Tag size={16} /> Style Tag Badge
                  </label>
                  <input 
                    type="text"
                    value={lookForm.tag}
                    onChange={(e) => handleLookInputChange('tag', e.target.value)}
                    required
                    placeholder="e.g. Festive, Modest, Casual"
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <FileText size={16} /> Fabric Details
                  </label>
                  <input 
                    type="text"
                    value={lookForm.fabric}
                    onChange={(e) => handleLookInputChange('fabric', e.target.value)}
                    placeholder="e.g. Premium Silk Blend"
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <Link2 size={16} /> Redirection Path (Link)
                </label>
                <input 
                  type="text"
                  value={lookForm.link}
                  onChange={(e) => handleLookInputChange('link', e.target.value)}
                  placeholder="e.g. /c/menswear"
                  className={styles.input}
                />
              </div>

              <div className={styles.formActionsRow}>
                <button type="submit" className={styles.submitBtn}>
                  <Save size={18} />
                  {editingLookId ? 'Save Look Config' : 'Add Look'}
                </button>
                {editingLookId && (
                  <button type="button" className={styles.cancelBtn} onClick={handleAddNewLook}>
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
      )}
    </div>
  );
}
