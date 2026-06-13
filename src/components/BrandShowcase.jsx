import styles from './BrandShowcase.module.css';

const brands = [
  { id: 1, name: 'Aeroplane', subtitle: 'Pioneering style' },
  { id: 2, name: 'SPACES', subtitle: 'Artful Living' },
  { id: 3, name: 'Holiday Island', subtitle: 'Creative expression' },
  { id: 4, name: 'ILLIYEEN', subtitle: 'High-End Retailer. Combining contemporary business fashion with refined artistry.', active: true },
  { id: 5, name: 'EXICUTIV', subtitle: 'Pursuit of excellence' },
  { id: 6, name: 'MAX Denim', subtitle: 'Innovative denim' },
  { id: 7, name: 'Zazir Edits', subtitle: 'Sartorial mastery' }
];

export default function BrandShowcase() {
  return (
    <section className={styles.showcaseSection}>
      <div className={styles.overlay}></div>
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.subtitle}>DISCOVER</span>
          <h2 className={styles.title}>Our Brands</h2>
        </div>
        
        <div className={styles.carouselContainer}>
          <div className={styles.cardsWrapper}>
            {brands.map((brand) => (
              <div 
                key={brand.id} 
                className={`${styles.brandCard} ${brand.active ? styles.activeCard : ''}`}
              >
                <div className={styles.cardContent}>
                  <h3>{brand.name}</h3>
                  <p className={styles.description}>{brand.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
