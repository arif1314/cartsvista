"use client";
import { useState, use, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Maximize2, Ruler, Lock, Share2, MessageCircle, Phone, Mail, Plus, Minus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatCurrency } from '@/lib/format/currency';
import styles from './page.module.css';

export default function ProductPage({ params }) {
  const resolvedParams = use(params);
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function fetchProduct() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/products/${resolvedParams.id}`);
        const data = await response.json();
        if (response.ok && data.success) {
          setProduct(data.product);
        } else {
          setProduct(null);
        }
      } catch {
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProduct();
  }, [resolvedParams.id]);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [product?.id]);

  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState('');
  
  // Gallery State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = product?.images?.length > 0 ? product.images : (product?.image ? [product.image] : ['https://placehold.co/600x800']);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Accordion State
  const [openAccordion, setOpenAccordion] = useState(null);

  const toggleAccordion = (index) => {
    setOpenAccordion(openAccordion === index ? null : index);
  };
  
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

  const productUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = product ? `Take a look at ${product.name} from CartsVista.` : 'Take a look at this CartsVista product.';

  const handleNativeShare = async () => {
    if (!productUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name || 'CartsVista product',
          text: shareText,
          url: productUrl,
        });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(productUrl);
      alert('Product link copied.');
    } catch {
      alert(productUrl);
    }
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
        <Link href="/">Home</Link> <span className={styles.separator}>/</span> {product.name} - {product.id.length > 10 ? product.id.substring(0, 8) : product.id}
      </div>

      <div className={styles.productContainer}>
        {/* Left Image Section */}
        <div className={styles.imageGallery}>
          <div className={styles.mainImageWrapper}>
            <button className={styles.iconBtnLeft} onClick={prevImage}><ChevronLeft size={20} /></button>
            <button className={styles.iconBtnRight} onClick={nextImage}><ChevronRight size={20} /></button>
            <button className={styles.iconBtnFullscreen}><Maximize2 size={16} /></button>
            <img src={images[currentImageIndex]} alt={product.name} className={styles.image} />
          </div>
          
          <div className={styles.imageIndicator}>
            <span className={styles.imageCount}>{currentImageIndex + 1} / {images.length}</span>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${((currentImageIndex + 1) / images.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {images.length > 1 && (
            <div className={styles.thumbnailGrid}>
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  className={`${styles.thumbnailBtn} ${index === currentImageIndex ? styles.thumbnailActive : ''}`}
                  onClick={() => setCurrentImageIndex(index)}
                  aria-label={`View product image ${index + 1}`}
                >
                  <img src={image} alt={`${product.name} ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Right Info Section */}
        <div className={styles.productInfoWrapper}>
          <div className={styles.productInfo}>
            <h1 className={styles.title}>{product.name}</h1>
            <p className={styles.productCode}>Product Code: {product.id.length > 8 ? product.id.substring(0,8).toUpperCase() : product.id.toUpperCase()}0905</p>
            
            <p className={styles.price}>{formatCurrency(product.price)}</p>
            
            <div className={styles.colorSection}>
              <p className={styles.colorLabel}><strong>Color:</strong> Dark Mauve</p>
              <div className={styles.colorSwatches}>
                {images.slice(0, 4).map((image, index) => (
                  <button
                    key={`${image}-swatch-${index}`}
                    type="button"
                    className={`${styles.swatch} ${index === currentImageIndex ? styles.swatchActive : ''}`}
                    onClick={() => setCurrentImageIndex(index)}
                    aria-label={`Select image ${index + 1}`}
                  >
                    <img src={image} alt={`Preview ${index + 1}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.sizeSection}>
              <div className={styles.sizeHeader}>
                <span>Select Size</span>
                <Link href="/pages/size-guide" className={styles.sizeGuide}>
                  Size Guide <Ruler size={14} className={styles.rulerIcon} />
                </Link>
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
              <button type="button" onClick={handleNativeShare} aria-label="Share product">
                <Share2 size={20} strokeWidth={1.5} />
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${productUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on WhatsApp"
              >
                <MessageCircle size={20} strokeWidth={1.5} />
              </a>
              <a href="tel:+8801711000000" aria-label="Call CartsVista">
                <Phone size={20} strokeWidth={1.5} />
              </a>
              <a
                href={`mailto:support@cartsvista.com?subject=${encodeURIComponent(product?.name || 'CartsVista product')}&body=${encodeURIComponent(`${shareText}\n\n${productUrl}`)}`}
                aria-label="Share by email"
              >
                <Mail size={20} strokeWidth={1.5} />
              </a>
            </div>
            
            <div className={styles.shortDescription}>
              <p>{product.description || 'Captivating in dark mauve with a majestic essence, this style features a collared neckline, metal zipper placket, gathered sleeves, and wrinkle-resistant premium crepe for effortless elegance.'}</p>
              <button className={styles.readMoreBtn}>Read more</button>
            </div>
            
            <div className={styles.accordions}>
              <div className={styles.accordion} onClick={() => toggleAccordion(1)}>
                <h3>Details {openAccordion === 1 ? <Minus size={16} /> : <Plus size={16} />}</h3>
                {openAccordion === 1 && (
                  <div className={styles.accordionContent}>
                    <p>{product.description || "Premium quality fabric, designed for comfort and style."}</p>
                  </div>
                )}
              </div>
              <div className={styles.accordion} onClick={() => toggleAccordion(2)}>
                <h3>Materials {openAccordion === 2 ? <Minus size={16} /> : <Plus size={16} />}</h3>
                {openAccordion === 2 && (
                  <div className={styles.accordionContent}>
                    <p>{product.materials || "100% Cotton / Premium Blend."}</p>
                  </div>
                )}
              </div>
              <div className={styles.accordion} onClick={() => toggleAccordion(3)}>
                <h3>Care {openAccordion === 3 ? <Minus size={16} /> : <Plus size={16} />}</h3>
                {openAccordion === 3 && (
                  <div className={styles.accordionContent}>
                    <p>Machine wash cold, do not bleach, tumble dry low.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
