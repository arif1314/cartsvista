"use client";
import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [user, setUser] = useState(null);

  const initialFormState = {
    label: 'Home',
    full_name: '',
    phone: '',
    address: '',
    apartment: '',
    city: '',
    postal_code: '',
    is_default: false
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchAddresses();
  }, []);

  async function fetchAddresses() {
    setIsLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      setUser(user);
      const { data } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (data) {
        setAddresses(data);
      }
    }
    setIsLoading(false);
  }

  const handleEdit = (address) => {
    setCurrentAddress(address);
    setFormData(address);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      const supabase = createClient();
      await supabase.from('user_addresses').delete().eq('id', id);
      setAddresses(addresses.filter(a => a.id !== id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const supabase = createClient();

    // If setting as default, first unset others
    if (formData.is_default) {
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    if (currentAddress) {
      // Update
      const { data } = await supabase
        .from('user_addresses')
        .update({
          ...formData,
          user_id: user.id
        })
        .eq('id', currentAddress.id)
        .select()
        .single();
      
      if (data) {
        setAddresses(addresses.map(a => a.id === data.id ? data : a));
      }
    } else {
      // Insert
      const { data } = await supabase
        .from('user_addresses')
        .insert({
          ...formData,
          user_id: user.id,
          // First address becomes default automatically
          is_default: addresses.length === 0 ? true : formData.is_default
        })
        .select()
        .single();
        
      if (data) {
        setAddresses([...addresses, data]);
      }
    }

    setIsEditing(false);
    setCurrentAddress(null);
    setFormData(initialFormState);
    fetchAddresses(); // Refresh to ensure correct default ordering
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Your Addresses</h2>
          <p className={styles.subtitle}>Manage your shipping and billing addresses.</p>
        </div>
        {!isEditing && (
          <button className={styles.addBtn} onClick={() => {
            setFormData(initialFormState);
            setCurrentAddress(null);
            setIsEditing(true);
          }}>
            <Plus size={16} /> Add New Address
          </button>
        )}
      </div>

      {isLoading ? (
        <p>Loading addresses...</p>
      ) : isEditing ? (
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h3>{currentAddress ? 'Edit Address' : 'Add New Address'}</h3>
          </div>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label>Address Label</label>
                <select 
                  value={formData.label} 
                  onChange={e => setFormData({...formData, label: e.target.value})}
                >
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={formData.full_name} 
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                  required 
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  required 
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Street Address</label>
              <input 
                type="text" 
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})}
                required 
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Apartment, suite, etc. (optional)</label>
              <input 
                type="text" 
                value={formData.apartment} 
                onChange={e => setFormData({...formData, apartment: e.target.value})}
              />
            </div>

            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label>City</label>
                <input 
                  type="text" 
                  value={formData.city} 
                  onChange={e => setFormData({...formData, city: e.target.value})}
                  required 
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Postal Code</label>
                <input 
                  type="text" 
                  value={formData.postal_code} 
                  onChange={e => setFormData({...formData, postal_code: e.target.value})}
                  required 
                />
              </div>
            </div>

            <div className={styles.checkboxGroup}>
              <input 
                type="checkbox" 
                id="isDefault" 
                checked={formData.is_default}
                onChange={e => setFormData({...formData, is_default: e.target.checked})}
              />
              <label htmlFor="isDefault">Set as default address</label>
            </div>

            <div className={styles.formActions}>
              <button 
                type="button" 
                className={styles.cancelBtn}
                onClick={() => {
                  setIsEditing(false);
                  setCurrentAddress(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className={styles.saveBtn}>
                Save Address
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className={styles.addressGrid}>
          {addresses.length === 0 ? (
            <div className={styles.emptyState}>
              <MapPin size={48} className={styles.emptyIcon} />
              <p>You have no saved addresses.</p>
            </div>
          ) : (
            addresses.map(address => (
              <div key={address.id} className={`${styles.addressCard} ${address.is_default ? styles.defaultCard : ''}`}>
                <div className={styles.cardHeader}>
                  <div className={styles.labelWrapper}>
                    <h4>{address.label}</h4>
                    {address.is_default && <span className={styles.defaultBadge}>Default</span>}
                  </div>
                  <div className={styles.cardActions}>
                    <button onClick={() => handleEdit(address)}><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(address.id)} className={styles.deleteBtn}><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.name}>{address.full_name}</p>
                  <p>{address.address}</p>
                  {address.apartment && <p>{address.apartment}</p>}
                  <p>{address.city}, {address.postal_code}</p>
                  <p className={styles.phone}>Phone: {address.phone}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
