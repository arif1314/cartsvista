"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, Clock, Phone } from 'lucide-react';
import { usePromos } from '@/context/PromoContext';
import { useBlogs } from '@/context/BlogContext';
import ProductCard from '@/components/ProductCard';
import styles from './page.module.css';

const FALLBACK_PRODUCT_IMAGE = 'https://placehold.co/600x800/f2f2f2/777777?text=CartsVista';

function formatCategoryTitle(category) {
  const value = String(category?.title || category?.name || '').trim().toLowerCase();
  if (value === 'men') return 'Menswear';
  if (value === 'women') return 'Womenswear';
  if (value === 'kids') return 'Kids Collection';
  if (value === 'accessories') return 'Accessories';
  return category?.title || category?.name || 'Collection';
}

function categoryHref(category) {
  return `/c/${category.slug || category.name}`;
}

function subcategoryHref(category, subcategory) {
  return `${categoryHref(category)}?subcategory=${encodeURIComponent(subcategory.name)}`;
}

export default function Home() {
  const { slides, promo2, promo3, promo4 } = usePromos();
  const { articles } = useBlogs();
  const [activeSlide, setActiveSlide] = useState(0);
  const [latestProducts, setLatestProducts] = useState([]);
  const [catalogSections, setCatalogSections] = useState([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);

  const reviews = [
    { name: "Liam Smith", rating: 5, loc: "London, UK", text: "The fabric feels premium, and the fit was exactly as described.", date: "Recent order", purchasedItem: "Premium Thobe" },
    { name: "Charlotte Evans", rating: 5, loc: "New York, USA", text: "Clean packaging, refined design, and the product matched the photos well.", date: "Verified buyer", purchasedItem: "Abaya Set" },
    { name: "Ayesha Rahman", rating: 4, loc: "Sylhet, BD", text: "Comfortable fabric and helpful sizing information before checkout.", date: "Verified buyer", purchasedItem: "Modest Abaya" },
    { name: "Nusrat Jahan", rating: 4, loc: "Dhaka, BD", text: "Customer support answered quickly and helped me choose the right size.", date: "Recent order", purchasedItem: "Cotton Thobe" }
  ];

  useEffect(() => {
    if (!slides || slides.length <= 1) return;

    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides]);

  useEffect(() => {
    async function loadLatestProducts() {
      try {
        const response = await fetch('/api/products?limit=8');
        const data = await response.json();
        if (response.ok && data.success) {
          setLatestProducts(data.products || []);
        }
      } catch {
        setLatestProducts([]);
      }
    }

    loadLatestProducts();
  }, []);

  useEffect(() => {
    async function loadCatalogSections() {
      setIsCatalogLoading(true);
      try {
        const categoryResponse = await fetch('/api/categories');
        const categoryData = await categoryResponse.json();
        const activeCategories = categoryResponse.ok && categoryData.success
          ? (categoryData.categories || []).filter((category) => category.isActive)
          : [];

        const sections = await Promise.all(activeCategories.map(async (category) => {
          const activeSubcategories = (category.children || []).filter((subcategory) => subcategory.isActive);
          const subcategories = await Promise.all(activeSubcategories.map(async (subcategory) => {
            const productResponse = await fetch(
              `/api/products?category=${encodeURIComponent(category.slug || category.name)}&subcategory=${encodeURIComponent(subcategory.name)}&limit=48`
            );
            const productData = await productResponse.json();
            const products = productResponse.ok && productData.success ? productData.products || [] : [];

            return {
              ...subcategory,
              products,
            };
          }));

          return {
            ...category,
            title: formatCategoryTitle(category),
            subcategories: subcategories.filter((subcategory) => subcategory.products.length > 0),
          };
        }));

        setCatalogSections(sections.filter((section) => section.subcategories.length > 0));
      } catch {
        setCatalogSections([]);
      } finally {
        setIsCatalogLoading(false);
      }
    }

    loadCatalogSections();
  }, []);

  return (
    <main className={styles.main}>
      {/* 1. Promo Banners Hybrid Grid-Slider */}
      <section className={styles.promoGrid}>
        {/* Left Column: Campaign Slideshow */}
        <div className={styles.promoLeft}>
          <div className={styles.sliderContainer}>
            {slides.map((slide, index) => {
              const isActive = index === activeSlide;
              return (
                <Link 
                  href={slide.link || "#"} 
                  key={slide.id}
                  className={`${styles.slide} ${isActive ? styles.activeSlide : ''}`}
                >
                  <img src={slide.image} alt={slide.title} className={styles.slideBg} />
                  <div className={styles.slideOverlay} />
                  <div className={styles.promoOverlayLeft}>
                    <h2>
                      {slide.title.split('\n').map((line, idx) => (
                        <span key={idx} style={{ display: 'block' }}>
                          {line}
                        </span>
                      ))}
                    </h2>
                  </div>
                </Link>
              );
            })}
            
            {/* Indicators for the Left Slider */}
            {slides.length > 1 && (
              <div className={styles.indicators}>
                {slides.map((_, index) => (
                  <button 
                    key={index} 
                    className={`${styles.indicatorDot} ${index === activeSlide ? styles.activeDot : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveSlide(index);
                    }}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Static Banners */}
        <div className={styles.promoRight}>
          <Link href={promo2.link || "#"} className={`${styles.promoImageWrapper} ${styles.promoTop}`}>
            <img src={promo2.image} alt={promo2.title} />
            <div className={styles.promoOverlayCenter}>
              <h3>{promo2.subtitle}</h3>
              <h2>{promo2.title}</h2>
              {promo2.badge && <span className={styles.badge}>{promo2.badge}</span>}
            </div>
          </Link>
          <div className={styles.promoBottomRow}>
            <Link href={promo3.link || "#"} className={styles.promoImageWrapper}>
              <img src={promo3.image} alt={promo3.title} />
              <div className={styles.promoOverlayCenterDark}>
                <h3>{promo3.subtitle}</h3>
                <p>{promo3.title}</p>
                {promo3.percentage && <h4>{promo3.percentage}</h4>}
              </div>
            </Link>
            <Link href={promo4.link || "#"} className={styles.promoImageWrapper}>
              <img src={promo4.image} alt={promo4.title} />
              <div className={styles.promoOverlayCenterStyle}>
                <h2>{promo4.title}</h2>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {isCatalogLoading ? (
        <CatalogSkeleton />
      ) : (
        catalogSections.map((section, index) => (
          <CategorySection
            key={section.id}
            category={section}
            index={String(index + 1).padStart(2, '0')}
          />
        ))
      )}

      {latestProducts.length > 0 && (
        <section className={styles.latestProductsSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.titleWithIndex}>
              <span className={styles.sectionIndex}>{String(catalogSections.length + 1).padStart(2, '0')}</span>
              <h2>Latest Arrivals</h2>
            </div>
            <Link href="/c/all" className={styles.exploreLink}>
              Explore Store
            </Link>
          </div>
          <div className={styles.latestProductsGrid}>
            {latestProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 7.5 Editorial Stories (Blog) */}
      <section className={styles.blogSection}>
        <div className={styles.sectionHeader}>
          <h2>Editorial Stories</h2>
          <span className={styles.sectionHeaderSubtitle}>Guides & Styling Advices</span>
        </div>
        <CarouselWrapper className={styles.blogGrid}>
          {articles.map((article) => (
            <div key={article.id} className={styles.blogCard}>
              <div className={styles.blogImgWrapper}>
                <img src={article.coverImage} alt={article.title} className={styles.blogImg} />
              </div>
              <div className={styles.blogContent}>
                <div className={styles.blogMeta}>
                  <span>{article.date}</span>
                  <span className={styles.metaDivider}>•</span>
                  <span>{article.readingTime}</span>
                </div>
                <h3 className={styles.blogTitle}>{article.title}</h3>
                <p className={styles.blogSummary}>{article.summary}</p>
                <div className={styles.blogFooter}>
                  <Link href={`/blog/${article.slug}`} className={styles.blogReadLink}>
                    Read Article
                    <ArrowRight size={14} />
                  </Link>
                  {article.link && (
                    <Link href={article.link} className={styles.blogShopLink}>
                      Shop Look
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CarouselWrapper>
      </section>

      {/* 8. Reviews Section */}
      <section className={styles.reviewsSection}>
        <div className={styles.reviewsHeader}>
          <span>TESTIMONIALS</span>
          <h2>Client Diaries</h2>
          <p>Stories from those who appreciate true craftsmanship and uncompromising quality.</p>
        </div>

        <div className={styles.reviewsGrid}>
          {/* Left Column: Rating Breakdown */}
          <div className={styles.ratingSummaryCard}>
            <div className={styles.ratingHeaderRow}>
              <span className={styles.ratingBigNumber}>4.5</span>
              <div className={styles.ratingStarGroup}>
                <div className={styles.starsRow}>
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <svg key={idx} className={styles.starIcon} viewBox="0 0 24 24" fill="var(--accent)">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                  ))}
                  <svg className={styles.starIcon} viewBox="0 0 24 24">
                    <defs>
                      <linearGradient id="starGrad">
                        <stop offset="70%" stopColor="var(--accent)" />
                        <stop offset="70%" stopColor="#444444" />
                      </linearGradient>
                    </defs>
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="url(#starGrad)" />
                  </svg>
                </div>
                <span className={styles.ratingSubtitle}>Selected customer feedback</span>
              </div>
            </div>

            {/* Breakdown Progress Bars */}
            <div className={styles.breakdownContainer}>
              <div className={styles.breakdownRow}>
                <span className={styles.breakdownLabel}>5 Star</span>
                <div className={styles.progressBar}>
                  <div className={styles.progressBarFill} style={{ width: '88%' }} />
                </div>
                <span className={styles.breakdownPercentage}>88%</span>
              </div>
              <div className={styles.breakdownRow}>
                <span className={styles.breakdownLabel}>4 Star</span>
                <div className={styles.progressBar}>
                  <div className={styles.progressBarFill} style={{ width: '9%' }} />
                </div>
                <span className={styles.breakdownPercentage}>9%</span>
              </div>
              <div className={styles.breakdownRow}>
                <span className={styles.breakdownLabel}>3 Star</span>
                <div className={styles.progressBar}>
                  <div className={styles.progressBarFill} style={{ width: '2%' }} />
                </div>
                <span className={styles.breakdownPercentage}>2%</span>
              </div>
              <div className={styles.breakdownRow}>
                <span className={styles.breakdownLabel}>2 Star</span>
                <div className={styles.progressBar}>
                  <div className={styles.progressBarFill} style={{ width: '1%' }} />
                </div>
                <span className={styles.breakdownPercentage}>1%</span>
              </div>
              <div className={styles.breakdownRow}>
                <span className={styles.breakdownLabel}>1 Star</span>
                <div className={styles.progressBar}>
                  <div className={styles.progressBarFill} style={{ width: '0%' }} />
                </div>
                <span className={styles.breakdownPercentage}>0%</span>
              </div>
            </div>
          </div>

          {/* Right Column: Carousel Wrapper of Compact Reviews */}
          <div className={styles.reviewsCarouselContainer}>
            <CarouselWrapper className={styles.reviewsCarouselGrid}>
              {reviews.map((review, i) => (
                <div key={i} className={styles.compactReviewCard}>
                  <div className={styles.compactCardHeader}>
                    <div className={styles.compactStarsRow}>
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <svg 
                          key={idx} 
                          className={styles.starIconSmall} 
                          viewBox="0 0 24 24"
                          fill={idx < review.rating ? "var(--accent)" : "#444444"}
                        >
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                        </svg>
                      ))}
                    </div>
                    <span className={styles.compactReviewDate}>{review.date}</span>
                  </div>

                  <p className={styles.compactReviewText}>"{review.text}"</p>

                  <div className={styles.compactReviewFooter}>
                    <div>
                      <h4 className={styles.compactReviewAuthor}>{review.name}</h4>
                      <span className={styles.compactReviewLoc}>{review.loc}</span>
                    </div>
                    <span className={styles.compactPurchasedBadge}>
                      {review.purchasedItem}
                    </span>
                  </div>
                </div>
              ))}
            </CarouselWrapper>
          </div>
        </div>
      </section>

      {/* 9. Newsletter Section */}
      <section className={styles.newsletterSectionModern}>
        <div className={styles.newsletterContainer}>
          <span>NEWSLETTER</span>
          <h2>Stay Connected</h2>
          <p>Subscribe to receive updates, access to exclusive deals, and more.</p>
          <form className={styles.newsletterFormModern} onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Enter your email address" required />
            <button type="submit"><ArrowRight size={20} strokeWidth={1} /></button>
          </form>
        </div>
      </section>

      {/* 10. Store Locations */}
      <section className={styles.storeLocationsModern}>
        <div className={styles.container}>
          <div className={styles.storeGridModern}>
            {/* Left Column: Store Image with Overlay Info */}
            <div className={styles.storeImageWrapper}>
              <img src="/store.png" alt="CartsVista Flagship Boutique" />
              <div className={styles.storeImageOverlay}>
                <span className={styles.overlayBadge}>The Flagship Atelier</span>
                <h2 className={styles.overlayTitle}>CartsVista Albuquerque</h2>
                
                <div className={styles.overlayAddressRow}>
                  <MapPin size={18} className={styles.overlayIcon} />
                  <p>1209 MOUNTAIN ROAD PL NE STE R, ALBUQUERQUE, NM 87110</p>
                </div>

                <a 
                  href="https://maps.google.com/?q=1209+MOUNTAIN+ROAD+PL+NE+STE+R+ALBUQUERQUE,+NM+87110" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={styles.overlayDirectionBtn}
                >
                  Get Directions
                </a>
              </div>
            </div>

            {/* Right Column: Store Brand Story & Hours */}
            <div className={styles.storeDetailsRight}>
              <span className={styles.rightHeader}>A Sensory Experience</span>
              <h3 className={styles.rightTitle}>Elevated Styling & Craft</h3>
              
              <p className={styles.rightDesc}>
                Step into a sanctuary of refined elegance. Our flagship Albuquerque boutique is curated to offer an immersive sensory journey through signature heritage tailoring, premium fragrance collections, and uncompromising craftsmanship. Enjoy personalized concierge styling and private viewing suites designed for the modern connoisseur.
              </p>

              <div className={styles.rightInfoBlock}>
                <div className={styles.rightInfoRow}>
                  <Clock size={18} className={styles.rightInfoIcon} />
                  <div>
                    <h4>Boutique Hours</h4>
                    <p>Monday – Saturday: 10:00 AM – 08:30 PM</p>
                    <p>Sunday: 12:00 PM – 06:00 PM</p>
                  </div>
                </div>

                <div className={styles.rightInfoRow}>
                  <Phone size={18} className={styles.rightInfoIcon} />
                  <div>
                    <h4>Styling Appointments</h4>
                    <p>Phone: +1 (505) 884-3682</p>
                    <p>Email: concierge@cartsvista.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}

function CatalogSkeleton() {
  return (
    <section className={styles.categorySection} aria-label="Loading collections">
      <div className={styles.sectionHeader}>
        <div className={styles.titleWithIndex}>
          <span className={styles.sectionIndex}>01</span>
          <div className={styles.skeletonTitle} />
        </div>
      </div>
      <div className={styles.collectionGrid}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={`${styles.collectionCard} ${styles.skeletonCard}`} />
        ))}
      </div>
    </section>
  );
}

function CategorySection({ category, index }) {
  if (!category?.subcategories || category.subcategories.length === 0) return null;

  return (
    <section className={styles.categorySection}>
      <div className={styles.sectionHeader}>
        <div className={styles.titleWithIndex}>
          <span className={styles.sectionIndex}>{index}</span>
          <h2>{category.title}</h2>
        </div>
        <Link href={categoryHref(category)} className={styles.exploreLink}>
          Explore All
        </Link>
      </div>
      <CarouselWrapper className={styles.collectionGrid}>
        {category.subcategories.map((subcategory) => {
          const representativeProduct = subcategory.products[0];
          const image = representativeProduct?.image || representativeProduct?.images?.[0] || FALLBACK_PRODUCT_IMAGE;

          return (
          <Link
            href={subcategoryHref(category, subcategory)}
            key={subcategory.id}
            className={styles.collectionCard}
          >
            <img
              src={image}
              alt={subcategory.name}
              loading="lazy"
              onError={(event) => {
                event.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
              }}
            />
            <div className={styles.collectionOverlay}>
              <h3>{subcategory.name}</h3>
            </div>
          </Link>
          );
        })}
      </CarouselWrapper>
    </section>
  );
}

function CarouselWrapper({ children, className }) {
  const scrollRef = useRef(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftFade(scrollLeft > 5);
      setShowRightFade(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      handleScroll();
      
      const observer = new ResizeObserver(() => {
        handleScroll();
      });
      observer.observe(el);

      return () => {
        observer.disconnect();
      };
    }
  }, [children]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75; // Scroll 75% of the viewport width
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={styles.carouselContainer}>
      <div 
        className={styles.edgeFadeLeft} 
        style={{ opacity: showLeftFade ? 1 : 0 }} 
      />
      <div 
        className={styles.edgeFadeRight} 
        style={{ opacity: showRightFade ? 1 : 0 }} 
      />
      
      {showLeftFade && (
        <button 
          className={styles.carouselBtnLeft} 
          onClick={() => scroll('left')}
          aria-label="Scroll Left"
        >
          <ChevronLeft size={20} />
        </button>
      )}
      
      {showRightFade && (
        <button 
          className={styles.carouselBtnRight} 
          onClick={() => scroll('right')}
          aria-label="Scroll Right"
        >
          <ChevronRight size={20} />
        </button>
      )}

      <div 
        ref={scrollRef} 
        onScroll={handleScroll} 
        className={className}
      >
        {children}
      </div>
    </div>
  );
}
