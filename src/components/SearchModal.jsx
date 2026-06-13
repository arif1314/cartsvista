"use client";
import { useState, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';
import { mockProducts } from '@/utils/mockData';
import Link from 'next/link';
import styles from './SearchModal.module.css';

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = 'auto';
      setQuery('');
      setResults([]);
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    let debounceTimer;
    if (query.trim().length > 1) {
      setIsLoading(true);
      debounceTimer = setTimeout(async () => {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .or(`name.ilike.%${query}%,category.ilike.%${query}%`);
        
        if (!error && data) {
          const formattedData = data.map(p => ({
            ...p,
            category: p.subcategory || p.category,
            image: p.images && p.images.length > 0 ? p.images[0] : 'https://placehold.co/600x800?text=No+Image'
          }));
          setResults(formattedData);
        } else {
          // Fallback to mock data
          const allProducts = [...mockProducts.menswear, ...mockProducts.womenswear];
          const filtered = allProducts.filter(p => 
            p.name.toLowerCase().includes(query.toLowerCase()) || 
            p.category.toLowerCase().includes(query.toLowerCase())
          );
          setResults(filtered);
        }
        setIsLoading(false);
      }, 300);
    } else {
      setResults([]);
      setIsLoading(false);
    }

    return () => clearTimeout(debounceTimer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <button className={styles.closeBtn} onClick={onClose}>
        <X size={32} strokeWidth={1} />
      </button>
      
      <div className={styles.modalContent}>
        <div className={styles.searchHeader}>
          <Search size={28} className={styles.searchIcon} />
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Search for products, categories..." 
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {query.length > 1 && (
          <div className={styles.resultsContainer}>
            <div className={styles.resultsHeader}>
              <span>{isLoading ? 'Searching...' : `${results.length} results found`}</span>
            </div>
            
            {results.length > 0 ? (
              <div className={styles.grid}>
                {results.map(product => (
                  <Link href={`/product/${product.id}`} key={product.id} className={styles.resultCard} onClick={onClose}>
                    <img src={product.image} alt={product.name} />
                    <div className={styles.resultInfo}>
                      <h4>{product.name}</h4>
                      <p>BDT {new Intl.NumberFormat('en-IN').format(product.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={styles.noResults}>
                <p>No products match your search.</p>
                <span>Try checking your spelling or use more general terms.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
