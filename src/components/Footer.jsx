"use client";
import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, MapPin, Phone, Mail, Clock } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  const [openCol, setOpenCol] = useState(null);

  const toggleCol = (index) => {
    setOpenCol(openCol === index ? null : index);
  };

  const columns = [
    { 
      title: "Collections", 
      links: [
        { label: "Menswear", href: "/c/menswear" }, 
        { label: "Womenswear", href: "/c/womenswear" }, 
        { label: "Kidswear", href: "/c/kidswear" }, 
        { label: "Fragrance", href: "/c/fragrance" }, 
        { label: "Accessories", href: "/c/accessories" }
      ] 
    },
    { 
      title: "Customer Care", 
      links: [
        { label: "Size Guide", href: "/pages/size-guide" }, 
        { label: "Exchange & Refund", href: "/pages/exchange-refund" }, 
        { label: "Shipping Policy", href: "/pages/shipping-policy" }, 
        { label: "Payment Policy", href: "/pages/payment-policy" },
        { label: "Loyalty Program", href: "/pages/loyalty-program" },
        { label: "Privacy Policy", href: "/pages/privacy-policy" }
      ] 
    },
    { 
      title: "Our Atelier", 
      links: [
        { label: "About Us", href: "/pages/about-us" }, 
        { label: "Inside Story", href: "/pages/inside-story" }, 
        { label: "Intellectual Property", href: "/pages/intellectual-property" }, 
        { label: "Gift Card Policy", href: "/pages/gift-card-policy" },
        { label: "Terms & Conditions", href: "/pages/terms-conditions" }
      ] 
    }
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          
          {/* Brand Column */}
          <div className={styles.brandColumn}>
            <Link href="/" className={styles.brandLogo}>
              CARTSVISTA
            </Link>
            <p className={styles.brandTagline}>UNCOMPROMISING ELEGANCE</p>
            <p className={styles.brandDesc}>
              A sanctuary of refined taste, blending timeless heritage with cutting-edge modern tailoring. Every collection is an immersive sensory journey through signature craftsmanship.
            </p>
            <div className={styles.socialLinks}>
              <a href="https://www.facebook.com/CartsVista" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>FB</a>
            </div>
          </div>

          {/* Links Columns */}
          {columns.map((col, idx) => (
            <div key={idx} className={styles.column}>
              <h3 className={styles.colHeader} onClick={() => toggleCol(idx)}>
                {col.title}
                <ChevronDown size={16} className={`${styles.chevron} ${openCol === idx ? styles.rotated : ''}`} />
              </h3>
              <ul className={`${styles.colList} ${openCol === idx ? styles.open : ''}`}>
                {col.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Boutique Column */}
          <div className={styles.contactColumn}>
            <h3 className={styles.colHeader}>Flagship Atelier</h3>
            <div className={styles.contactDetails}>
              <div className={styles.contactItem}>
                <MapPin size={15} className={styles.contactIcon} />
                <p>1209 MOUNTAIN ROAD PL NE STE R,<br />ALBUQUERQUE, NM 87110</p>
              </div>
              <div className={styles.contactItem}>
                <Phone size={15} className={styles.contactIcon} />
                <a href="tel:+15058843682">+1 (505) 884-3682</a>
              </div>
              <div className={styles.contactItem}>
                <Mail size={15} className={styles.contactIcon} />
                <a href="mailto:concierge@cartsvista.com">concierge@cartsvista.com</a>
              </div>
              <div className={styles.contactItem}>
                <Clock size={15} className={styles.contactIcon} />
                <div className={styles.hoursBlock}>
                  <p>Mon – Sat: 10:00 AM – 08:30 PM</p>
                  <p>Sunday: 12:00 PM – 06:00 PM</p>
                </div>
              </div>
            </div>
          </div>

        </div>
        
        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <div className={styles.bottomFlex}>
            <p>© 2026 CARTSVISTA. Crafted with uncompromising elegance.</p>
            <div className={styles.paymentMethods}>
              <span className={styles.paymentLabel}>SECURE SYSTEM:</span>
              <img 
                src="https://user-images.githubusercontent.com/52581/44384465-5e312780-a570-11e8-9336-7b54978a9e64.png" 
                alt="Secure Payment Gateways" 
                className={styles.payBanner} 
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
