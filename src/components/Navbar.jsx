"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Search, User, ShoppingBag, Heart, Mail, Phone, ChevronDown } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCategory } from '@/context/CategoryContext';
import SearchModal from '@/components/SearchModal';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [activeMenu, setActiveMenu] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLangPopupOpen, setIsLangPopupOpen] = useState(false);
  const { cartCount, setIsCartOpen } = useCart();
  const { wishlistCount } = useWishlist();
  const { categories } = useCategory();

  const menuList = Object.entries(categories).map(([id, category]) => ({
    id,
    label: category.title
  }));

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
              <h2 className={styles.megaTitle}>{categories[activeMenu].title}</h2>
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
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
