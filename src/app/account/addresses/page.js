"use client";
import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react';
import styles from './page.module.css';

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [message, setMessage] = useState('');

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
    const response = await fetch('/api/account/addresses');
    const data = await response.json().catch(() => ({}));

    if (response.ok && data.success) {
      setAddresses(data.addresses || []);
    } else {
      setMessage(data.error || 'Unable to load addresses.');
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
      const response = await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        await fetchAddresses();
        return;
      }

      window.alert(data.error || 'Unable to delete this address.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const response = await fetch(
      currentAddress ? `/api/account/addresses/${currentAddress.id}` : '/api/account/addresses',
      {
        method: currentAddress ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      }
    );
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      setMessage(data.error || 'Unable to save this address.');
      return;
    }

    setIsEditing(false);
    setCurrentAddress(null);
    setFormData(initialFormState);
    fetchAddresses();
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

      {message && <div className={styles.notice}>{message}</div>}

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
