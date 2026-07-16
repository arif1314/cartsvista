"use client";
import { useState, useEffect } from 'react';
import { Search, Mail, Phone, Calendar, Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    setIsLoading(true);
    const supabase = createClient();
    
    // Fetch profiles and aggregate order data
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id, 
        full_name, 
        phone, 
        role, 
        created_at
      `)
      .order('created_at', { ascending: false });

    // Note: Due to foreign key constraints, we can fetch orders for these users if user_id was linked in migration
    // If not, we'll just show profile data for now.
    
    if (profiles) {
      setCustomers(profiles);
    }
    
    setIsLoading(false);
  }

  const filteredCustomers = customers.filter(customer => 
    (customer.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (customer.phone?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Customers</h1>
          <p className={styles.subtitle}>Manage your customer base and view their details.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.exportBtn}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search customers by name or phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loading}>Loading customers...</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="4" className={styles.emptyState}>No customers found.</td>
                </tr>
              ) : (
                filteredCustomers.map(customer => (
                  <tr key={customer.id}>
                    <td>
                      <div className={styles.customerInfo}>
                        <div className={styles.avatar}>
                          {customer.full_name?.substring(0, 2).toUpperCase() || 'CU'}
                        </div>
                        <div>
                          <p className={styles.name}>{customer.full_name || 'Unnamed Customer'}</p>
                          <p className={styles.id}>ID: {customer.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.roleBadge} ${customer.role === 'admin' || customer.role === 'super_admin' ? styles.adminBadge : ''}`}>
                        {customer.role.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className={styles.contactInfo}>
                        <Phone size={14} /> {customer.phone || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div className={styles.dateInfo}>
                        <Calendar size={14} /> {formatDate(customer.created_at)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
