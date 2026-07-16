"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

function SettingsContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUser(user);
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (data) {
          setFormData({
            fullName: data.full_name || '',
            phone: data.phone || '',
          });
        }
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const isResetMode = searchParams.get('mode') === 'reset';

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.fullName,
        phone: formData.phone,
      })
      .eq('id', user.id);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Profile updated successfully.');
    }
    setIsSaving(false);
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('Error: Passwords do not match.');
      setIsSaving(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage('Error: Password must be at least 6 characters.');
      setIsSaving(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: passwordData.newPassword
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Password updated successfully.');
      setPasswordData({ newPassword: '', confirmPassword: '' });
    }
    setIsSaving(false);
  };

  if (isLoading) return <div>Loading settings...</div>;

  return (
    <div className={styles.settingsContainer}>
      <h2 className={styles.title}>Account Settings</h2>
      <p className={styles.subtitle}>Update your personal information and security settings.</p>

      {message && (
        <div className={styles.messageBanner} style={{ 
          padding: '1rem', 
          marginBottom: '1rem', 
          borderRadius: '4px',
          backgroundColor: message.startsWith('Error') ? '#fef2f2' : '#f0fdf4',
          color: message.startsWith('Error') ? '#b91c1c' : '#15803d',
          border: `1px solid ${message.startsWith('Error') ? '#f87171' : '#4ade80'}`
        }}>
          {message}
        </div>
      )}

      <div className={styles.formCard}>
        {!isResetMode && (
          <form onSubmit={handleProfileSave} className={styles.form}>
            <div className={styles.formSection}>
              <h3>Personal Information</h3>
              
              <div className={styles.inputGroup}>
                <label htmlFor="fullName">Full Name</label>
                <input 
                  type="text" 
                  id="fullName" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  required 
                />
              </div>
              
              <div className={styles.inputGroup}>
                <label htmlFor="email">Email Address</label>
                <input 
                  type="email" 
                  id="email" 
                  defaultValue={user?.email} 
                  disabled 
                  style={{ backgroundColor: '#f5f5f5', color: '#666' }}
                />
                <small style={{ color: '#666', marginTop: '4px' }}>Email cannot be changed.</small>
              </div>
              
              <div className={styles.inputGroup}>
                <label htmlFor="phone">Phone Number</label>
                <input 
                  type="tel" 
                  id="phone" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}

        <div className={styles.divider}></div>

        <form onSubmit={handlePasswordSave} className={styles.form}>
          <div className={styles.formSection}>
            <h3>{isResetMode ? 'Reset Password' : 'Change Password'}</h3>
            
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="newPassword">New Password</label>
                <input 
                  type="password" 
                  id="newPassword" 
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  required 
                  minLength={6}
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input 
                  type="password" 
                  id="confirmPassword" 
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  required 
                  minLength={6}
                />
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.saveBtn} disabled={isSaving}>
              {isSaving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
