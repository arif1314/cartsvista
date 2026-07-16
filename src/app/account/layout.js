"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, Package, Settings, LogOut, MapPin, MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import styles from './layout.module.css';

export default function AccountLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserEmail(user.email);
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
    { href: '/account', label: 'Overview', icon: User, exact: true },
    { href: '/account/orders', label: 'Order History', icon: Package, exact: false },
    { href: '/account/addresses', label: 'Addresses', icon: MapPin, exact: false },
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
            <div className={styles.avatar}>
              {profile ? profile.full_name?.substring(0, 2).toUpperCase() : 'U'}
            </div>
            <div className={styles.userDetails}>
              <h3>{isLoading ? 'Loading...' : profile?.full_name || 'User'}</h3>
              <p>{isLoading ? '...' : userEmail}</p>
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
            
            <button className={`${styles.navLink} ${styles.logoutBtn}`} onClick={handleLogout}>
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
