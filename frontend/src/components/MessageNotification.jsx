import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./MessageNotification.module.css";

const MessageNotification = ({ notification, onClose, onViewChat }) => {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [senderChatId, setSenderChatId] = useState(null);

  // Fetch the chat ID for the sender when notification is received
  useEffect(() => {
    const fetchSenderChatId = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `/api/chat/chat-id/${notification.senderId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSenderChatId(data.chatId.toString());
        }
      } catch (error) {
        console.error("Error fetching sender chat ID:", error);
      }
    };

    if (notification.senderId) {
      fetchSenderChatId();
    }
  }, [notification.senderId]);

  useEffect(() => {
    // Auto-hide the notification after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  // Check if we're in chat and if the message is from someone other than the current chat
  const shouldShowNotification = () => {
    if (!location.pathname.startsWith("/chat")) {
      // Always show if not in chat
      return true;
    }

    // Get the current chat ID from the URL
    const currentUrlChatId = location.pathname.split("/").pop();

    // Show notification if we're in a different chat than the sender's chat
    return senderChatId && currentUrlChatId !== senderChatId;
  };

  const handleViewChat = async () => {
    if (senderChatId) {
      // Call the onViewChat callback before navigating
      onViewChat && onViewChat();
      // If we already have the chat ID, use it directly
      navigate(`/chat/${senderChatId}`);
    } else {
      try {
        // Fallback to fetching the chat ID
        const token = localStorage.getItem("token");
        const response = await fetch(
          `/api/chat/chat-id/${notification.senderId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Call the onViewChat callback before navigating
          onViewChat && onViewChat();
          navigate(`/chat/${data.chatId}`);
        } else {
          console.error("Failed to get chat ID");
          navigate("/chat"); // Fallback to main chat page
        }
      } catch (error) {
        console.error("Error getting chat ID:", error);
        navigate("/chat"); // Fallback to main chat page
      }
    }
    onClose();
  };

  // Don't render if notification shouldn't be shown
  if (!isVisible || !shouldShowNotification()) return null;

  return (
    <div className={styles.notificationContainer}>
      <div className={styles.notification}>
        <div className={styles.content}>
          <h3>New Message from {notification.senderDisplayName}!</h3>
          <div className={styles.buttons}>
            <button className={styles.viewButton} onClick={handleViewChat}>
              View Chat
            </button>
            <button className={styles.closeButton} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageNotification;
