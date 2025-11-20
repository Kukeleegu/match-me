import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ConnectionRequests.module.css";

export default function ConnectionRequests() {
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profilePictures, setProfilePictures] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchConnectionRequests();
    
    // Cleanup function to revoke object URLs
    return () => {
      Object.values(profilePictures).forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  const fetchConnectionRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/likes/received", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const requestsData = await response.json();
        setConnectionRequests(requestsData);
        // Fetch profile pictures for all users who liked you
        requestsData.forEach((request) => {
          fetchProfilePicture(request.likerId, token);
        });
      } else {
        throw new Error("Failed to fetch connection requests");
      }
    } catch (err) {
      console.error("Error fetching connection requests:", err);
      setError("Failed to load connection requests");
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

  const handleUserClick = (userId) => {
    navigate(`/users/${userId}`);
  };

  const handleLikeUser = async (e, userId) => {
    e.stopPropagation(); // Prevent card click
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/likes/interact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          likedUserId: userId,
          like: true,
        }),
      });

      if (response.ok) {
        // Remove this user from the connection requests list
        setConnectionRequests((prev) =>
          prev.filter((request) => request.likerId !== userId)
        );
      } else {
        console.error("Failed to like user");
      }
    } catch (err) {
      console.error("Error liking user:", err);
    }
  };

  const handlePassUser = async (e, userId) => {
    e.stopPropagation(); // Prevent card click
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/likes/interact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          likedUserId: userId,
          like: false,
        }),
      });

      if (response.ok) {
        // Remove this user from the connection requests list
        setConnectionRequests((prev) =>
          prev.filter((request) => request.likerId !== userId)
        );
      } else {
        console.error("Failed to pass user");
      }
    } catch (err) {
      console.error("Error passing user:", err);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading connection requests...</div>
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
      <h1 className={styles.title}>Connection Requests</h1>
      <p className={styles.subtitle}>Users who have liked you</p>

      {connectionRequests.length === 0 ? (
        <div className={styles.noRequests}>
          <h2>No connection requests yet</h2>
          <p>When someone likes your profile, they'll appear here!</p>
        </div>
      ) : (
        <div className={styles.requestsGrid}>
          {connectionRequests.map((request) => (
            <div
              key={request.id}
              className={styles.requestCard}
              onClick={() => handleUserClick(request.likerId)}
            >
              <div className={styles.requestCard__avatar}>
                <img
                  src={profilePictures[request.likerId] || "/default-avatar.png"}
                  alt={`${request.likerDisplayName || "User"}'s profile`}
                  className={styles.requestCard__image}
                />
              </div>
              <div className={styles.requestCard__info}>
                <h3>{request.likerDisplayName || "Unknown User"}</h3>
                <div className={styles.requestCard__actions}>
                  <button
                    className={`${styles.actionButton} ${styles.actionButton__pass}`}
                    onClick={(e) => handlePassUser(e, request.likerId)}
                    title="Pass on this user"
                  >
                    ✕ Pass
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.actionButton__like}`}
                    onClick={(e) => handleLikeUser(e, request.likerId)}
                    title="Like this user back"
                  >
                    ♥ Like
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}