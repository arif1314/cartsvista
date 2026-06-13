"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Package, Settings, LogOut, MapPin, MessageSquare } from 'lucide-react';
import styles from './layout.module.css';

export default function AccountLayout({ children }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/account', label: 'Overview', icon: User, exact: true },
    { href: '/account/orders', label: 'Order History', icon: Package, exact: false },
    { href: '/account/support', label: 'Support Tickets', icon: MessageSquare, exact: false },
    { href: '/account/settings', label: 'Settings', icon: Settings, exact: false },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link> <span className={styles.separator}>/</span> 
          <span className={styles.current}>My Account</span>
        </div>
        <h1 className={styles.pageTitle}>My Account</h1>
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>SA</div>
            <div className={styles.userDetails}>
              <h3>Shahria Arif</h3>
              <p>shahria.arif@example.com</p>
            </div>
          </div>
          
          <nav className={styles.nav}>
            {navItems.map((item) => {
              const isActive = item.exact 
                ? pathname === item.href 
                : pathname.startsWith(item.href);
                
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                >
                  <item.icon size={18} className={styles.navIcon} />
                  {item.label}
                </Link>
              );
            })}
            
            <button className={`${styles.navLink} ${styles.logoutBtn}`}>
              <LogOut size={18} className={styles.navIcon} />
              Sign Out
            </button>
          </nav>
        </aside>

        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
}
