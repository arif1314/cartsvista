"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, Clock, Phone } from 'lucide-react';
import { usePromos } from '@/context/PromoContext';
import { useBlogs } from '@/context/BlogContext';
import styles from './page.module.css';

export default function Home() {
  const { slides, promo2, promo3, promo4, lookbooks, isLoaded: promosLoaded } = usePromos();
  const { articles, isLoaded: blogsLoaded } = useBlogs();
  const [activeSlide, setActiveSlide] = useState(0);

  const reviews = [
    { name: "Liam Smith", rating: 5, loc: "London, UK", text: "The luxury look and drape of their Thobe is exceptional. It fits like a dream.", date: "2 days ago", purchasedItem: "Premium Silk Thobe" },
    { name: "Charlotte Evans", rating: 5, loc: "New York, USA", text: "Absolutely stunning craftsmanship. The Abaya fabric is lightweight yet feels incredibly rich.", date: "3 days ago", purchasedItem: "Nidha Abaya Set" },
    { name: "Shahria Arif", rating: 5, loc: "Dhaka, BD", text: "The fit of the Luxury Kabli Set is absolutely perfect. The craftsmanship is world-class.", date: "1 day ago", purchasedItem: "Luxury Kabli Set" },
    { name: "Ayesha Rahman", rating: 5, loc: "Sylhet, BD", text: "The Nidha fabric is incredibly soft and comfortable. Perfect for hot weather.", date: "2 days ago", purchasedItem: "Modest Nidha Abaya" },
    { name: "Karim Uddin", rating: 5, loc: "Chittagong, BD", text: "Highly recommend the Royal Sherwani. Packaging was premium, felt like a luxury brand.", date: "5 days ago", purchasedItem: "Royal Sherwani" },
    { name: "Nusrat Jahan", rating: 4, loc: "Dhaka, BD", text: "Great customer service and premium packaging. The cotton thobe is very breathable.", date: "1 week ago", purchasedItem: "Premium Cotton Thobe" },
    { name: "Oliver Taylor", rating: 5, loc: "Manchester, UK", text: "Extremely satisfied with the Panjabi. Fits perfectly and looks elegant.", date: "1 week ago", purchasedItem: "Luxury Panjabi Set" },
    { name: "Amelia Davies", rating: 5, loc: "Los Angeles, USA", text: "The floral scarf prints are gorgeous. Exceeded my high expectations.", date: "2 weeks ago", purchasedItem: "Chiffon Silk Scarf" },
    { name: "James Wilson", rating: 5, loc: "Birmingham, UK", text: "Every detail is perfect, from stitching to the elegant packaging. Outstanding quality.", date: "2 weeks ago", purchasedItem: "Royal Oud Perfume" },
    { name: "Sophia Miller", rating: 4, loc: "Boston, USA", text: "The perfume smells sublime and lasts all day. Will definitely purchase again.", date: "3 weeks ago", purchasedItem: "Royal Oud Perfume" },
    { name: "Henry Brown", rating: 5, loc: "Leeds, UK", text: "Uncompromising quality. The fabric drape is beautiful.", date: "3 weeks ago", purchasedItem: "Breathable Cotton Thobe" },
    { name: "Emily Johnson", rating: 5, loc: "Chicago, USA", text: "CartsVista has become my go-to for modern modest wear.", date: "1 month ago", purchasedItem: "Georgette Hijab & Abaya" },
    { name: "Arthur Wright", rating: 4, loc: "Bristol, UK", text: "Excellent Peshawari sandals. Comfortable and authentic leather.", date: "1 month ago", purchasedItem: "Leather Peshawari Sandals" },
    { name: "Isabella Walker", rating: 5, loc: "Miami, USA", text: "Breathable fabric, perfect fit, and excellent customer service.", date: "1 month ago", purchasedItem: "Nidha Abaya Set" },
    { name: "George Harris", rating: 5, loc: "Edinburgh, UK", text: "Beautiful premium materials. Packaging is highly luxurious.", date: "1 month ago", purchasedItem: "Luxury Panjabi Set" },
    { name: "Mia Anderson", rating: 4, loc: "Seattle, USA", text: "The Oud fragrance is rich and long-lasting. Excellent presentation.", date: "2 months ago", purchasedItem: "Royal Oud Perfume" }
  ];

  useEffect(() => {
    if (!slides || slides.length <= 1) return;

    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides]);

  if (!promosLoaded || !blogsLoaded || !promo2 || !promo3 || !promo4 || !lookbooks || !articles) {
    return (
      <main className={styles.main}>
        <div className={styles.loadingSlider}>Loading Storefront...</div>
      </main>
    );
  }

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

      {/* 2. Category: Menswear */}
      <CategorySection title="Menswear" index="01" collections={[
        { name: "Thobe", image: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=1780" },
        { name: "Kabli", image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1887" },
        { name: "Panjabi", image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=2071" },
        { name: "Sherwani", image: "https://images.unsplash.com/photo-1550639524-a6f58345a278?q=80&w=1926" }
      ]} />

      {/* 3. Category: Womenswear */}
      <CategorySection title="Womenswear" index="02" collections={[
        { name: "Abaya", image: "https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?q=80&w=1886" },
        { name: "Tops And Shirts", image: "https://images.unsplash.com/photo-1434389678369-183314aa6e1c?q=80&w=1948" },
        { name: "Dress And Dress Set", image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=1946" },
        { name: "Scarf", image: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1915" }
      ]} />

      {/* 4. Category: Kidswear */}
      <CategorySection title="Kidswear" index="03" collections={[
        { name: "Girls", image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?q=80&w=2015" },
        { name: "Boys", image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?q=80&w=1972" },
        { name: "Mother And Daughter Collection", image: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?q=80&w=2070" },
        { name: "Father and Son Collection", image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=2070" }
      ]} />

      {/* 5. Category: Fragrance */}
      <CategorySection title="Fragrance" index="04" collections={[
        { name: "Premium", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1904" },
        { name: "Luxury", image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1887" },
        { name: "Al Haramain", image: "https://images.unsplash.com/photo-1595425970377-c9703bc48b2d?q=80&w=1935" },
        { name: "Best Selling", image: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=1887" }
      ]} />

      {/* 6. Category: Accessories */}
      <CategorySection title="Accessories" index="05" collections={[
        { name: "Bags", image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1938" },
        { name: "Home Decor", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069" },
        { name: "Watches", image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=2080" },
        { name: "Wallets", image: "https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=1888" }
      ]} />

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
              <span className={styles.ratingBigNumber}>4.7</span>
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
                <span className={styles.ratingSubtitle}>Based on 2,450+ reviews</span>
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

function CategorySection({ title, collections, index }) {
  return (
    <section className={styles.categorySection}>
      <div className={styles.sectionHeader}>
        <div className={styles.titleWithIndex}>
          <span className={styles.sectionIndex}>{index}</span>
          <h2>{title}</h2>
        </div>
        <Link href={`/c/${title.toLowerCase()}`} className={styles.exploreLink}>
          Explore All
        </Link>
      </div>
      <CarouselWrapper className={styles.collectionGrid}>
        {collections.map((col, i) => (
          <Link href={`/c/${title.toLowerCase()}`} key={i} className={styles.collectionCard}>
            <img src={col.image} alt={col.name} />
            <div className={styles.collectionOverlay}>
              <h3>{col.name}</h3>
            </div>
          </Link>
        ))}
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
