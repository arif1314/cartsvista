"use client";

import { useEffect, useState } from 'react';
import styles from './CustomAlert.module.css';

export default function CustomAlert() {
  const [alertState, setAlertState] = useState(null);

  useEffect(() => {
    const nativeAlert = window.alert;

    window.alert = (message) => {
      setAlertState({
        title: 'CartsVista Notice',
        message: String(message || 'Something needs your attention.'),
      });
    };

    window.cartsVistaAlert = ({ title = 'CartsVista Notice', message = '' } = {}) => {
      setAlertState({ title, message: String(message || 'Something needs your attention.') });
    };

    return () => {
      window.alert = nativeAlert;
      delete window.cartsVistaAlert;
    };
  }, []);

  if (!alertState) return null;

  return (
    <div className={styles.overlay} role="presentation">
      <div className={styles.dialog} role="alertdialog" aria-modal="true" aria-labelledby="cv-alert-title">
        <div className={styles.header}>
          <span className={styles.kicker}>Message</span>
          <h2 id="cv-alert-title">{alertState.title}</h2>
        </div>
        <p>{alertState.message}</p>
        <button type="button" onClick={() => setAlertState(null)}>
          OK
        </button>
      </div>
    </div>
  );
}
