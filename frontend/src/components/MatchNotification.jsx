import React, { useState, useEffect } from "react";
import styles from "./MatchNotification.module.css";

const MatchNotification = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-hide the notification after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) return null;

  return (
    <div className={styles.notificationContainer}>
      <div className={styles.notification}>
        <div className={styles.content}>
          <h3> It's a Match! </h3>
          <p>{notification.message}</p>
          <div className={styles.buttons}>
            <button
              className={styles.viewButton}
              onClick={() => {
                // Navigate to matches page or chat
                window.location.href = `/matches`;
                onClose();
              }}
            >
              View Matches
            </button>
            <button
              className={styles.closeButton}
              onClick={() => {
                setIsVisible(false);
                onClose();
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchNotification;
