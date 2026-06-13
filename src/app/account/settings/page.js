"use client";
import styles from './page.module.css';

export default function SettingsPage() {
  const handleSave = (e) => {
    e.preventDefault();
    alert("Profile updated successfully.");
  };

  return (
    <div className={styles.settingsContainer}>
      <h2 className={styles.title}>Account Settings</h2>
      <p className={styles.subtitle}>Update your personal information and security settings.</p>

      <div className={styles.formCard}>
        <form onSubmit={handleSave} className={styles.form}>
          <div className={styles.formSection}>
            <h3>Personal Information</h3>
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="firstName">First Name</label>
                <input type="text" id="firstName" defaultValue="Shahria" />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="lastName">Last Name</label>
                <input type="text" id="lastName" defaultValue="Arif" />
              </div>
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email Address</label>
              <input type="email" id="email" defaultValue="shahria.arif@example.com" />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="phone">Phone Number</label>
              <input type="tel" id="phone" defaultValue="+880 1711 000 000" />
            </div>
          </div>

          <div className={styles.divider}></div>

          <div className={styles.formSection}>
            <h3>Change Password</h3>
            <div className={styles.inputGroup}>
              <label htmlFor="currentPassword">Current Password</label>
              <input type="password" id="currentPassword" />
            </div>
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="newPassword">New Password</label>
                <input type="password" id="newPassword" />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input type="password" id="confirmPassword" />
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.saveBtn}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
