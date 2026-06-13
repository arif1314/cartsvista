"use client";
import { useState, use, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight, Maximize2, Ruler, Lock, Share2, MessageCircle, Phone, Mail, Plus } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';
import { mockProducts } from '@/utils/mockData';
import { useCart } from '@/context/CartContext';
import styles from './page.module.css';

export default function ProductPage({ params }) {
  const resolvedParams = use(params);
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function fetchProduct() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();
      
      if (!error && data) {
        setProduct({
          ...data,
          image: data.images && data.images.length > 0 ? data.images[0] : 'https://placehold.co/600x800'
        });
      } else {
        const allProducts = [...mockProducts.menswear, ...mockProducts.womenswear];
        setProduct(allProducts.find(p => p.id === resolvedParams.id));
      }
      setIsLoading(false);
    }
    fetchProduct();
  }, [resolvedParams.id]);

  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState('');
  
  // Custom sizes configuration mimicking the provided screenshot structure
  const sizes = [
    { label: 'XS/52', available: true },
    { label: 'S/54', available: true },
    { label: 'M/56', available: false },
    { label: 'L/58', available: false },
    { label: 'XL/60', available: true },
  ];

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert("Please select a size first.");
      return;
    }
    addToCart(product, 1, selectedSize);
  };

  if (isLoading) {
    return <div className={styles.pageWrapper} style={{ padding: '4rem', textAlign: 'center' }}>Loading product details...</div>;
  }

  if (!product) {
    return notFound();
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.breadcrumb}>
        <a href="/">Home</a> <span className={styles.separator}>/</span> {product.name} - {product.id.length > 10 ? product.id.substring(0, 8) : product.id}
      </div>

      <div className={styles.productContainer}>
        {/* Left Image Section */}
        <div className={styles.imageGallery}>
          <div className={styles.mainImageWrapper}>
            <button className={styles.iconBtnLeft}><ChevronLeft size={20} /></button>
            <button className={styles.iconBtnRight}><ChevronRight size={20} /></button>
            <button className={styles.iconBtnFullscreen}><Maximize2 size={16} /></button>
            <img src={product.image} alt={product.name} className={styles.image} />
          </div>
          
          <div className={styles.imageIndicator}>
            <span className={styles.imageCount}>1 / 4</span>
            <div className={styles.progressBar}>
              <div className={styles.progressFill}></div>
            </div>
          </div>
        </div>
        
        {/* Right Info Section */}
        <div className={styles.productInfoWrapper}>
          <div className={styles.productInfo}>
            <h1 className={styles.title}>{product.name}</h1>
            <p className={styles.productCode}>Product Code: {product.id.length > 8 ? product.id.substring(0,8).toUpperCase() : product.id.toUpperCase()}0905</p>
            
            <p className={styles.price}>BDT {product.price?.toLocaleString() || product.price}</p>
            
            <div className={styles.colorSection}>
              <p className={styles.colorLabel}><strong>Color:</strong> Dark Mauve</p>
              <div className={styles.colorSwatches}>
                <div className={`${styles.swatch} ${styles.swatchActive}`}>
                  <img src={product.image} alt="Color 1" />
                </div>
                <div className={styles.swatch}>
                  <img src={product.image} alt="Color 2" />
                </div>
              </div>
            </div>

            <div className={styles.sizeSection}>
              <div className={styles.sizeHeader}>
                <span>Select Size</span>
                <button className={styles.sizeGuide}>
                  Size Guide <Ruler size={14} className={styles.rulerIcon} />
                </button>
              </div>
              <div className={styles.sizeGrid}>
                {sizes.map(size => (
                  <button 
                    key={size.label}
                    disabled={!size.available}
                    className={`
                      ${styles.sizeBtn} 
                      ${selectedSize === size.label ? styles.sizeSelected : ''}
                      ${!size.available ? styles.sizeDisabled : ''}
                    `}
                    onClick={() => setSelectedSize(size.label)}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
              <div className={styles.stockWarning}>
                <span className={styles.stockBadge}>Only 1 left</span>
              </div>
            </div>
            
            <button className={styles.addToCartBtn} onClick={handleAddToCart}>
              <Lock size={16} className={styles.btnIcon} /> Add to bag
            </button>
            
            <button className={styles.findInStoreBtn}>
              Find in store
            </button>
            
            <div className={styles.socialShare}>
              <button><Share2 size={20} strokeWidth={1.5} /></button>
              <button><MessageCircle size={20} strokeWidth={1.5} /></button>
              <button><Phone size={20} strokeWidth={1.5} /></button>
              <button><Mail size={20} strokeWidth={1.5} /></button>
            </div>
            
            <div className={styles.shortDescription}>
              <p>{product.description || 'Captivating in dark mauve with a majestic essence, this style features a collared neckline, metal zipper placket, gathered sleeves, and wrinkle-resistant premium crepe for effortless elegance.'}</p>
              <button className={styles.readMoreBtn}>Read more</button>
            </div>
            
            <div className={styles.accordions}>
              <div className={styles.accordion}>
                <h3>Details <Plus size={16} /></h3>
              </div>
              <div className={styles.accordion}>
                <h3>Materials <Plus size={16} /></h3>
              </div>
              <div className={styles.accordion}>
                <h3>Care <Plus size={16} /></h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
