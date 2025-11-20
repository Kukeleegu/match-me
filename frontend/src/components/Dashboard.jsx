// src/components/Dashboard.jsx
import React from 'react';
import styles from './SharedStyles.module.css';

export default function Dashboard() {
  return (
    <div className={styles.container}>
      <div className={styles.centeredBox}>
        <h1>Welcome to Your Dashboard!</h1>
        <p>This is your personal dashboard where you can manage your profile and preferences.</p>
        <p>Use the menu to navigate to different sections of the app.</p>
      </div>
    </div>
  );
}
