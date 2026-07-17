"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut, Bell, Tag, FileText, MessageSquare, Percent, Truck, Images } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import styles from './layout.module.css';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setProfile(data);
        }
      }
      setIsLoading(false);
    }
    loadProfile();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/products', label: 'Products', icon: Package, exact: false },
    { href: '/admin/media', label: 'Image Library', icon: Images, exact: false },
    { href: '/admin/categories', label: 'Categories', icon: Package, exact: false },
    { href: '/admin/brands', label: 'Brands', icon: Tag, exact: false },
    { href: '/admin/promos', label: 'Promotions', icon: Tag, exact: false },
    { href: '/admin/coupons', label: 'Coupons', icon: Percent, exact: false },
    { href: '/admin/blog', label: 'Editorial Blogs', icon: FileText, exact: false },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, exact: false },
    { href: '/admin/shipping', label: 'Shipping', icon: Truck, exact: false },
    { href: '/admin/notifications', label: 'Notifications', icon: Bell, exact: false },
    { href: '/admin/support', label: 'Support Tickets', icon: MessageSquare, exact: false },
    { href: '/admin/customers', label: 'Customers', icon: Users, exact: false },
    { href: '/admin/staff', label: 'Staff & Roles', icon: Users, exact: false },
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
          <button className={styles.logoutBtn} onClick={handleLogout}>
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
            <Link href="/admin/notifications" className={styles.iconBtn}>
              <Bell size={20} />
              <span className={styles.notificationBadge}>3</span>
            </Link>
            <div className={styles.adminProfile}>
              <div className={styles.avatar}>
                {profile ? profile.full_name?.substring(0, 2).toUpperCase() : 'A'}
              </div>
              <div className={styles.profileText}>
                <span className={styles.name}>
                  {isLoading ? 'Loading...' : profile?.full_name || 'Admin'}
                </span>
                <span className={styles.role}>
                  {profile?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </span>
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
