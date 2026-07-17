"use client";
import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Filter, ChevronDown } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { useCategory } from '@/context/CategoryContext';
import styles from './page.module.css';

export default function CategoryPage({ params }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const categoryStr = resolvedParams.category;
  const { categories } = useCategory();
  
  const categoryContextData = categories[categoryStr];
  const title = categoryContextData ? categoryContextData.title : categoryStr.charAt(0).toUpperCase() + categoryStr.slice(1).replace('-', ' ');
  
  // Filter States
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [sortBy, setSortBy] = useState('Featured');
  const subcategoryParam = searchParams.get('subcategory') || '';

  // Initialize and update products
  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true);
      try {
        const categoryQuery = categoryStr === 'all' ? '' : `&category=${encodeURIComponent(categoryStr)}`;
        const response = await fetch(`/api/products?limit=48${categoryQuery}`);
        const data = await response.json();
        const nextProducts = response.ok && data.success ? data.products || [] : [];
        setProducts(nextProducts);
        if (subcategoryParam) {
          setSelectedCategories([subcategoryParam]);
          setFilteredProducts(nextProducts.filter((product) => product.subcategory === subcategoryParam));
        } else {
          setSelectedCategories([]);
          setFilteredProducts(nextProducts);
        }
      } catch {
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, [categoryStr, subcategoryParam]);

  const uniqueSubCategories = Array.from(new Set(products.map(p => p.subcategory).filter(Boolean)));

  const handleApplyFilters = () => {
    let result = [...products];

    // 1. Filter by Subcategory
    if (selectedCategories.length > 0) {
      result = result.filter(product => selectedCategories.includes(product.subcategory));
    }

    // 2. Filter by Price
    if (selectedPriceRanges.length > 0) {
      result = result.filter(product => {
        const p = product.price;
        return selectedPriceRanges.some(range => {
          if (range === 'under5') return p < 5000;
          if (range === '5to10') return p >= 5000 && p <= 10000;
          if (range === '10to15') return p >= 10000 && p <= 15000;
          if (range === 'over15') return p > 15000;
          return true;
        });
      });
    }

    // 3. Filter by Size
    if (selectedSizes.length > 0) {
      result = result.filter(product => {
        const productSizes = product.sizes || (product.id.toString().endsWith('2') || product.id.toString().endsWith('4')
          ? ['M', 'L', 'XL']
          : ['S', 'M', 'L']);
        return selectedSizes.some(size => productSizes.includes(size));
      });
    }

    setFilteredProducts(result);
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedPriceRanges([]);
    setSelectedSizes([]);
    setFilteredProducts(products);
  };

  // Sorting Handler
  const getSortedProducts = () => {
    let result = [...filteredProducts];
    if (sortBy === 'Price: Low to High') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'Price: High to Low') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'Newest') {
      result.reverse();
    }
    return result;
  };

  const sortedProducts = getSortedProducts();

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link> <span className={styles.separator}>/</span> {title}
        </div>
        <h1 className={styles.pageTitle}>{title}</h1>
      </div>

      <div className={styles.layout}>
        {/* Sidebar Filters */}
        <aside className={styles.sidebar}>
          <div className={styles.filterHeader}>
            <h3><Filter size={18} /> Filters</h3>
          </div>
          
          {/* Subcategory Filter */}
          {uniqueSubCategories.length > 0 && (
            <div className={styles.filterGroup}>
              <div className={styles.filterGroupHeader}>
                <span>Category Type</span>
                <ChevronDown size={16} />
              </div>
              <ul className={styles.filterList}>
                {uniqueSubCategories.map(subCat => (
                  <li key={subCat}>
                    <label>
                      <input 
                        type="checkbox" 
                        checked={selectedCategories.includes(subCat)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, subCat]);
                          } else {
                            setSelectedCategories(selectedCategories.filter(c => c !== subCat));
                          }
                        }}
                      /> {subCat}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Price Range Filter */}
          <div className={styles.filterGroup}>
            <div className={styles.filterGroupHeader}>
              <span>Price</span>
              <ChevronDown size={16} />
            </div>
            <ul className={styles.filterList}>
              <li>
                <label>
                  <input 
                    type="checkbox" 
                    checked={selectedPriceRanges.includes('under5')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPriceRanges([...selectedPriceRanges, 'under5']);
                      } else {
                        setSelectedPriceRanges(selectedPriceRanges.filter(r => r !== 'under5'));
                      }
                    }}
                  /> Under $5,000
                </label>
              </li>
              <li>
                <label>
                  <input 
                    type="checkbox" 
                    checked={selectedPriceRanges.includes('5to10')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPriceRanges([...selectedPriceRanges, '5to10']);
                      } else {
                        setSelectedPriceRanges(selectedPriceRanges.filter(r => r !== '5to10'));
                      }
                    }}
                  /> $5,000 - $10,000
                </label>
              </li>
              <li>
                <label>
                  <input 
                    type="checkbox" 
                    checked={selectedPriceRanges.includes('10to15')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPriceRanges([...selectedPriceRanges, '10to15']);
                      } else {
                        setSelectedPriceRanges(selectedPriceRanges.filter(r => r !== '10to15'));
                      }
                    }}
                  /> $10,000 - $15,000
                </label>
              </li>
              <li>
                <label>
                  <input 
                    type="checkbox" 
                    checked={selectedPriceRanges.includes('over15')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPriceRanges([...selectedPriceRanges, 'over15']);
                      } else {
                        setSelectedPriceRanges(selectedPriceRanges.filter(r => r !== 'over15'));
                      }
                    }}
                  /> Over $15,000
                </label>
              </li>
            </ul>
          </div>
          
          {/* Size Filter */}
          <div className={styles.filterGroup}>
            <div className={styles.filterGroupHeader}>
              <span>Size</span>
              <ChevronDown size={16} />
            </div>
            <ul className={styles.filterList}>
              {['S', 'M', 'L', 'XL'].map(size => (
                <li key={size}>
                  <label>
                    <input 
                      type="checkbox" 
                      checked={selectedSizes.includes(size)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSizes([...selectedSizes, size]);
                        } else {
                          setSelectedSizes(selectedSizes.filter(s => s !== size));
                        }
                      }}
                    /> Size {size}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className={styles.filterActions}>
            <button className={styles.applyBtn} onClick={handleApplyFilters}>
              Apply Filters
            </button>
            <button className={styles.clearBtn} onClick={handleClearFilters}>
              Clear All
            </button>
          </div>
        </aside>

        {/* Product Grid */}
        <main className={styles.mainContent}>
          <div className={styles.toolbar}>
            <p className={styles.resultCount}>Showing {sortedProducts.length} products</p>
            <div className={styles.sortWrapper}>
              <span>Sort by:</span>
              <select 
                className={styles.sortSelect} 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option>Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest</option>
              </select>
            </div>
          </div>

          <div className={styles.grid}>
            {isLoading ? (
              <div className={styles.emptyState}>
                <p>Loading products...</p>
              </div>
            ) : sortedProducts.length > 0 ? (
              sortedProducts.map(product => (
                <div key={product.id} className={styles.gridItem}>
                  <ProductCard product={product} />
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>No products found matching the selected filters. Try clearing some selections!</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
