import React, { useState, useEffect } from "react";
import styles from "./MatchesPage.module.css";
import { useNavigate } from "react-router-dom";
import webSocketService from "../services/WebSocketService";

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [disconnectUserId, setDisconnectUserId] = useState(null);
  const [profilePictures, setProfilePictures] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const navigate = useNavigate();

  useEffect(() => {
    fetchMatches();
    // Connect to WebSocket if not already connected
    const token = localStorage.getItem("token");
    if (token && !webSocketService.isConnected()) {
      webSocketService.connect(token, matches, {});
    }

    // Subscribe to presence updates
    webSocketService.addOnPresenceCallback((users) => {
      setOnlineUsers(new Map(users));
    });

    // Cleanup function to revoke object URLs
    return () => {
      Object.values(profilePictures).forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  const fetchMatches = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/likes/enriched-matches", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const matchesData = await response.json();
        setMatches(matchesData);
        // Fetch profile pictures for all matches
        matchesData.forEach((match) => {
          fetchProfilePicture(match.likedId, token);
        });
      } else {
        throw new Error("Failed to fetch matches");
      }
    } catch (err) {
      console.error("Error fetching matches:", err);
      setError("Failed to load matches");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfilePicture = async (userId, token) => {
    try {
      const response = await fetch(`/api/files/profile-picture/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        // Revoke previous URL if it exists
        if (
          profilePictures[userId] &&
          profilePictures[userId].startsWith("blob:")
        ) {
          URL.revokeObjectURL(profilePictures[userId]);
        }
        const imageUrl = URL.createObjectURL(blob);
        setProfilePictures((prev) => ({
          ...prev,
          [userId]: imageUrl,
        }));
      }
    } catch (error) {
      console.error("Error fetching profile picture:", error);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectUserId) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/likes/remove", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          likedUserId: disconnectUserId,
        }),
      });

      if (response.ok) {
        // Remove the disconnected match from the list
        setMatches(
          matches.filter((match) => match.likedId !== disconnectUserId)
        );
      } else {
        setError("Failed to disconnect from user");
      }
    } catch (err) {
      console.error("Error disconnecting from user:", err);
      setError("Failed to disconnect from user");
    } finally {
      setShowConfirmDialog(false);
      setDisconnectUserId(null);
    }
  };

  const openDisconnectConfirm = (e, userId) => {
    e.stopPropagation(); // Prevent card click when clicking disconnect button
    setDisconnectUserId(userId);
    setShowConfirmDialog(true);
  };

  const handleCardClick = (userId) => {
    navigate(`/users/${userId}`);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading your matches...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Your Matches</h1>

      {matches.length === 0 ? (
        <div className={styles.noMatches}>
          <h2>No matches yet</h2>
          <p>Start liking people to find your matches!</p>
          <p>When someone likes you back, they'll appear here.</p>
        </div>
      ) : (
        <div className={styles.matchesGrid}>
          {matches.map((match) => (
            <div
              key={match.id}
              className={styles.matchCard}
              onClick={() => handleCardClick(match.likedId)}
            >
              <button
                className={styles.disconnectButton}
                onClick={(e) => openDisconnectConfirm(e, match.likedId)}
                title="Disconnect from this user"
              >
                ×
              </button>
              <div className={styles.matchCard__avatar}>
                <img
                  src={profilePictures[match.likedId] || "/default-avatar.png"}
                  alt={`${match.userProfile?.displayName || "User"}'s profile`}
                  className={styles.matchCard__image}
                />
                <div
                  className={`${styles.onlineIndicator} ${
                    webSocketService.isUserOnline(match.likedId.toString())
                      ? styles.online
                      : styles.offline
                  }`}
                  title={
                    webSocketService.isUserOnline(match.likedId.toString())
                      ? "Online"
                      : "Offline"
                  }
                />
              </div>
              <div className={styles.matchCard__info}>
                <h3>{match.userProfile?.displayName || "Unknown"}</h3>
                <div className={styles.matchCard__details}>
                  <p className={styles.matchCard__basicInfo}>
                    {match.userProfile?.age || "?"} •{" "}
                    {match.userProfile?.gender || "?"} •{" "}
                    {match.userProfile?.county || "Unknown location"}
                  </p>
                  {match.userProfile?.aboutMe && (
                    <p className={styles.matchCard__about}>
                      {match.userProfile?.aboutMe?.length > 100
                        ? `${match.userProfile.aboutMe.substring(0, 100)}...`
                        : match.userProfile.aboutMe}
                    </p>
                  )}
                  <button
                    className={styles.matchCard__badge}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent opening profile
                      // First get the chat ID for this match
                      const token = localStorage.getItem("token");
                      fetch(`/api/chat/chat-id/${match.likedId}`, {
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      })
                        .then((response) => response.json())
                        .then((data) => {
                          navigate(`/chat/${data.chatId}`);
                        })
                        .catch((error) => {
                          console.error("Error getting chat ID:", error);
                          navigate("/chat");
                        });
                    }}
                  >
                    Chat
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showConfirmDialog && (
        <div className={styles.confirmDialog}>
          <div className={styles.confirmDialog__content}>
            <h2>Disconnect from Match</h2>
            <p>
              Are you sure you want to disconnect from this match? This action
              cannot be undone.
            </p>
            <div className={styles.confirmDialog__buttons}>
              <button
                className={styles.confirmDialog__button_confirm}
                onClick={handleDisconnect}
              >
                Yes, Disconnect
              </button>
              <button
                className={styles.confirmDialog__button_cancel}
                onClick={() => {
                  setShowConfirmDialog(false);
                  setDisconnectUserId(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
