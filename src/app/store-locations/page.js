"use client";
import Link from 'next/link';
import { MapPin, Phone, Clock } from 'lucide-react';
import styles from './page.module.css';

export default function StoreLocationsPage() {
  const stores = [
    {
      city: "Dhaka",
      area: "Gulshan",
      address: "CartsVista Tower, 45 Gulshan Avenue, Gulshan 1, Dhaka 1212",
      phone: "+880 1999 111 222",
      hours: "Saturday - Thursday: 10:00 AM - 10:00 PM\nFriday: 2:00 PM - 10:00 PM",
      image: "https://images.unsplash.com/photo-1567449303078-57ad995bd3fa?q=80&w=800&auto=format&fit=crop"
    },
    {
      city: "Dhaka",
      area: "Dhanmondi",
      address: "Level 2, Premium Plaza, Road 27, Dhanmondi, Dhaka 1209",
      phone: "+880 1999 111 333",
      hours: "Saturday - Thursday: 10:00 AM - 9:00 PM\nFriday: 2:00 PM - 9:00 PM",
      image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=800&auto=format&fit=crop"
    },
    {
      city: "Chattogram",
      area: "Nasirabad",
      address: "Ground Floor, Grand Mall, Nasirabad, Chattogram",
      phone: "+880 1999 111 444",
      hours: "Saturday - Thursday: 10:00 AM - 9:00 PM\nFriday: 3:00 PM - 9:00 PM",
      image: "https://images.unsplash.com/photo-1555529733-0e670560f8e1?q=80&w=800&auto=format&fit=crop"
    },
    {
      city: "Sylhet",
      area: "Zindabazar",
      address: "Blue Water Gallery, 1st Floor, Zindabazar, Sylhet",
      phone: "+880 1999 111 555",
      hours: "Saturday - Thursday: 10:00 AM - 8:00 PM\nFriday: Closed",
      image: "https://images.unsplash.com/photo-1555529771-835f59bfc50c?q=80&w=800&auto=format&fit=crop"
    }
  ];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link> <span className={styles.separator}>/</span> 
          <span className={styles.current}>Store Locations</span>
        </div>
        <h1 className={styles.pageTitle}>Experience CartsVista</h1>
        <p className={styles.subtitle}>Visit our flagship stores to discover the true essence of premium craftsmanship.</p>
      </div>

      <div className={styles.storeGrid}>
        {stores.map((store, index) => (
          <div key={index} className={styles.storeCard}>
            <div className={styles.imageWrapper}>
              <img src={store.image} alt={`${store.area} Store`} className={styles.storeImage} />
              <div className={styles.cityBadge}>{store.city}</div>
            </div>
            <div className={styles.storeInfo}>
              <h2>{store.area} Flagship</h2>
              
              <div className={styles.infoRow}>
                <MapPin className={styles.icon} size={20} />
                <p>{store.address}</p>
              </div>
              
              <div className={styles.infoRow}>
                <Clock className={styles.icon} size={20} />
                <p className={styles.hours}>{store.hours}</p>
              </div>
              
              <div className={styles.infoRow}>
                <Phone className={styles.icon} size={20} />
                <p>{store.phone}</p>
              </div>

              <button className={styles.directionsBtn}>Get Directions</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
