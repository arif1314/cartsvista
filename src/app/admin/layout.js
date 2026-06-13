"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut, Bell, Tag, FileText, MessageSquare } from 'lucide-react';
import styles from './layout.module.css';

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/products', label: 'Products', icon: Package, exact: false },
    { href: '/admin/categories', label: 'Categories', icon: Package, exact: false },
    { href: '/admin/promos', label: 'Promotions', icon: Tag, exact: false },
    { href: '/admin/blog', label: 'Editorial Blogs', icon: FileText, exact: false },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, exact: false },
    { href: '/admin/support', label: 'Support Tickets', icon: MessageSquare, exact: false },
    { href: '/admin/customers', label: 'Customers', icon: Users, exact: false },
    { href: '/admin/settings', label: 'Settings', icon: Settings, exact: false },
  ];

  return (
    <div className={styles.adminContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>CartsVista<span className={styles.adminBadge}>ADMIN</span></h2>
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
                <item.icon size={20} className={styles.navIcon} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.storeLink}>
            Return to Store
          </Link>
          <button className={styles.logoutBtn}>
            <LogOut size={18} className={styles.navIcon} />
            Logout
          </button>
        </div>
      </aside>

      <div className={styles.mainWrapper}>
        <header className={styles.topbar}>
          <div className={styles.topbarTitle}>
            <h3>Overview</h3>
          </div>
          <div className={styles.topbarActions}>
            <button className={styles.iconBtn}>
              <Bell size={20} />
              <span className={styles.notificationBadge}>3</span>
            </button>
            <div className={styles.adminProfile}>
              <div className={styles.avatar}>SA</div>
              <div className={styles.profileText}>
                <span className={styles.name}>Shahria Arif</span>
                <span className={styles.role}>Super Admin</span>
              </div>
            </div>
          </div>
        </header>
        
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
}
