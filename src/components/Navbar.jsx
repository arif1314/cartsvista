"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, User, ShoppingBag, Heart, Mail, Phone, ChevronDown } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCategory } from '@/context/CategoryContext';
import SearchModal from '@/components/SearchModal';
import { formatCurrency } from '@/lib/format/currency';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [activeMenu, setActiveMenu] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLangPopupOpen, setIsLangPopupOpen] = useState(false);
  const [menuProducts, setMenuProducts] = useState({});
  const { cartCount, setIsCartOpen } = useCart();
  const { wishlistCount } = useWishlist();
  const { categories } = useCategory();

  const menuList = Object.entries(categories).map(([id, category]) => ({
    id,
    label: category.title
  }));

  useEffect(() => {
    if (!activeMenu || menuProducts[activeMenu]) return;

    let isMounted = true;
    async function loadMenuProducts() {
      try {
        const response = await fetch(`/api/products?category=${encodeURIComponent(activeMenu)}&limit=8`);
        const data = await response.json();
        if (isMounted && response.ok && data.success) {
          setMenuProducts((current) => ({
            ...current,
            [activeMenu]: data.products || [],
          }));
        }
      } catch {
        if (isMounted) {
          setMenuProducts((current) => ({ ...current, [activeMenu]: [] }));
        }
      }
    }

    loadMenuProducts();
    return () => {
      isMounted = false;
    };
  }, [activeMenu, menuProducts]);

  return (
    <div className={styles.navWrapper} onMouseLeave={() => setActiveMenu(null)}>
      <header className={styles.header}>
        {/* Top Bar */}
        <div className={styles.topBar}>
          <div className={styles.topLinks}>
            <div className={styles.langWrapper}>
              <button 
                className={styles.langBtn} 
                onClick={() => setIsLangPopupOpen(!isLangPopupOpen)}
                aria-expanded={isLangPopupOpen}
              >
                English <ChevronDown size={12} className={`${styles.chevron} ${isLangPopupOpen ? styles.chevronOpen : ''}`} />
              </button>
              {isLangPopupOpen && (
                <div className={styles.langPopup}>
                  <button 
                    className={styles.langOption} 
                    onClick={() => setIsLangPopupOpen(false)}
                  >
                    English
                  </button>
                </div>
              )}
            </div>
            <a href="mailto:support@cartsvista.com" className={styles.topBarLink}>
              <Mail size={14} className={styles.topBarIcon} />
              support@cartsvista.com
            </a>
            <Link href="/contact" className={styles.topBarLink}>
              <Phone size={14} className={styles.topBarIcon} />
              Contact
            </Link>
          </div>
          <div className={styles.topApps}>
            <Link href="/apps" className={styles.appsLink}>Apps</Link>
          </div>
        </div>
        
        {/* Main Navbar */}
        <nav className={styles.navbar}>
          <div className={styles.logoContainer}>
            <Link href="/" className={styles.logo}>
              CartsVista<span className={styles.logoDot}>.</span>
            </Link>
          </div>
          
          <div className={styles.navLinks}>
            {menuList.map(item => (
              <div 
                key={item.id}
                className={`${styles.navItem} ${activeMenu === item.id ? styles.navItemActive : ''}`}
                onMouseEnter={() => setActiveMenu(item.id)}
              >
                <Link href={`/c/${item.id}`}>{item.label}</Link>
              </div>
            ))}
          </div>
          
          <div className={styles.actions}>
            <button className={styles.iconBtn} aria-label="Search" onClick={() => setIsSearchOpen(true)}>
              <Search size={20} strokeWidth={1.5} />
            </button>
            <Link href="/account" className={styles.iconBtn} aria-label="Account">
              <User size={20} strokeWidth={1.5} />
            </Link>
            <Link href="/wishlist" className={styles.iconBtn} aria-label="Wishlist">
              <Heart size={20} strokeWidth={1.5} />
              {wishlistCount > 0 && <span className={styles.cartBadge}>{wishlistCount}</span>}
            </Link>
            <button className={styles.iconBtn} aria-label="Cart" onClick={() => setIsCartOpen(true)}>
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
            </button>
          </div>
        </nav>
      </header>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Megamenu Dropdown */}
      <div className={`${styles.megaMenu} ${activeMenu && categories[activeMenu] ? styles.megaMenuOpen : ''}`}>
        {activeMenu && categories[activeMenu] && (
          <div className={styles.megaMenuInner}>
            {/* Left Sidebar Menu */}
            <div className={styles.megaSidebar}>
              {menuList.map(item => (
                <div 
                  key={item.id} 
                  className={`${styles.sidebarItem} ${activeMenu === item.id ? styles.sidebarItemActive : ''}`}
                  onMouseEnter={() => setActiveMenu(item.id)}
                >
                  {item.label}
                </div>
              ))}
            </div>
            
            {/* Right Content Area */}
            <div className={styles.megaContent}>
              <div className={styles.megaHeader}>
                <div>
                  <h2 className={styles.megaTitle}>{categories[activeMenu].title}</h2>
                  <p className={styles.megaSubtitle}>Explore latest arrivals from this category.</p>
                </div>
                <Link href={`/c/${activeMenu}`} className={styles.megaViewAll}>
                  View all
                </Link>
              </div>
              <div className={styles.megaGrid}>
                {/* Subcategories List */}
                <div className={styles.subcatList}>
                  {(categories[activeMenu].children?.length
                    ? categories[activeMenu].children.map((child) => child.name)
                    : categories[activeMenu].collections || []
                  ).map(sub => (
                    <Link
                      key={sub}
                      href={`/c/${activeMenu}?subcategory=${encodeURIComponent(sub)}`}
                      className={styles.subcatLink}
                    >
                      {sub}
                    </Link>
                  ))}
                </div>

                <div className={styles.megaProductArea}>
                  {(menuProducts[activeMenu] || []).length > 0 ? (
                    <div className={styles.megaProductGrid}>
                      {(menuProducts[activeMenu] || []).slice(0, 6).map((product) => (
                        <Link
                          key={product.id}
                          href={`/product/${product.id}`}
                          className={styles.megaProductCard}
                        >
                          <div className={styles.megaProductImage}>
                            <img src={product.image || product.images?.[0]} alt={product.name} />
                          </div>
                          <div className={styles.megaProductInfo}>
                            <span>{product.subcategory || categories[activeMenu].title}</span>
                            <h3>{product.name}</h3>
                            <p>{formatCurrency(product.price)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.megaEmptyState}>
                      <p>New arrivals will appear here once products are published.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
