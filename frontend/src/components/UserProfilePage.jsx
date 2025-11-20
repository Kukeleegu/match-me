import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./Profile.module.css";

export default function UserProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [basicUserData, setBasicUserData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");

        // First fetch basic user info to get the correct profile link
        const basicUserRes = await fetch(`/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!basicUserRes.ok) {
          throw new Error("Failed to fetch basic user data");
        }

        const basicUser = await basicUserRes.json();
        setBasicUserData(basicUser);

        // Then fetch profile and bio data
        const [profileRes, bioRes] = await Promise.all([
          fetch(`/api/users/${userId}/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`/api/users/${userId}/bio`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (!profileRes.ok || !bioRes.ok) {
          throw new Error("Failed to fetch user data");
        }

        const [profile, bio] = await Promise.all([
          profileRes.json(),
          bioRes.json(),
        ]);

        setUserData({ profile, bio });

        // Fetch and set profile picture
        const pictureRes = await fetch(`/api/files/profile-picture/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (pictureRes.ok) {
          const blob = await pictureRes.blob();
          const url = URL.createObjectURL(blob);
          setProfilePictureUrl(url);
        } else {
          setProfilePictureUrl("/default-avatar.png");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user data");
      }
    };

    if (userId) {
      fetchUserData();
    }

    // Cleanup function to revoke object URL
    return () => {
      if (profilePictureUrl.startsWith("blob:")) {
        URL.revokeObjectURL(profilePictureUrl);
      }
    };
  }, [userId]);

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          {error}
          <button 
            onClick={() => navigate(-1)} 
            className={styles.editButton}
            style={{ marginLeft: '10px' }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  const { profile, bio } = userData;

  return (
    <div className={styles.container}>
      <div className={styles.profileCard}>
        <div className={styles.header}>
          <h1 className={styles.header__title}>
            {basicUserData?.displayName || profile?.displayName}'s Profile
          </h1>
          <div className={styles.actions}>
            <button 
              onClick={() => navigate(-1)} 
              className={styles.editButton}
            >
              Go Back
            </button>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h2 className={styles.section__title}>Basic Information</h2>
            <div className={styles.info}>
              <div className={styles.avatar}>
                <img
                  src={profilePictureUrl || "/default-avatar.png"}
                  alt="Profile"
                  className={styles.avatar__image}
                  onError={(e) => (e.target.src = "/default-avatar.png")}
                />
              </div>
              <div className={styles.basicInfoGrid}>
                <div className={styles.basicInfoColumn}>
                  <div className={styles.infoItem}>
                    <label className={styles.infoItem__label}>
                      Display Name:
                    </label>
                    <span className={styles.infoItem__value}>
                      {profile?.displayName || "Not set"}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <label className={styles.infoItem__label}>Gender:</label>
                    <span className={styles.infoItem__value}>
                      {profile?.gender || "Not specified"}
                    </span>
                  </div>
                </div>
                <div className={styles.basicInfoColumn}>
                  <div className={styles.infoItem}>
                    <label className={styles.infoItem__label}>Age:</label>
                    <span className={styles.infoItem__value}>
                      {profile?.age || "Not specified"}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <label className={styles.infoItem__label}>Location:</label>
                    <span className={styles.infoItem__value}>
                      {profile?.county || "Not set"}
                    </span>
                  </div>
                </div>
                <div
                  className={`${styles.infoItem} ${styles.infoItem_fullWidth} ${styles.infoItem_aboutMe}`}
                >
                  <label className={styles.infoItem__label}>About Me:</label>
                  <p className={styles.infoItem__text}>
                    {profile?.aboutMe || "No description provided"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.section__title}>Interests & Preferences</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label className={styles.infoItem__label}>Interests:</label>
                <div className={styles.tags}>
                  {bio?.interests?.length > 0 ? (
                    bio.interests.map((interest, index) => (
                      <span key={index} className={styles.tag}>
                        {interest.name}
                        <span className={styles.tagMeta}>
                          {interest.type === "ACTIVITY" ? " 🏃" : " 🎯"}
                        </span>
                      </span>
                    ))
                  ) : (
                    <span className={styles.empty}>No interests listed</span>
                  )}
                </div>
              </div>

              <div className={styles.infoItem}>
                <label className={styles.infoItem__label}>
                  Favorite Cuisine:
                </label>
                <span className={styles.infoItem__value}>
                  {bio?.favouriteCuisine || "Not specified"}
                </span>
              </div>

              <div className={styles.infoItem}>
                <label className={styles.infoItem__label}>
                  Favorite Music Genre:
                </label>
                <span className={styles.infoItem__value}>
                  {bio?.favouriteMusicGenre || "Not specified"}
                </span>
              </div>

              <div className={styles.infoItem}>
                <label className={styles.infoItem__label}>
                  Pet Preference:
                </label>
                <span className={styles.infoItem__value}>
                  {bio?.petPreference || "Not specified"}
                </span>
              </div>

              <div className={styles.infoItem}>
                <label className={styles.infoItem__label}>Looking For:</label>
                <span className={styles.infoItem__value}>
                  {bio?.lookingFor || "Not specified"}
                </span>
              </div>

              <div
                className={`${styles.infoItem} ${styles.infoItem_fullWidth}`}
              >
                <label className={styles.infoItem__label}>
                  Priority Traits:
                </label>
                <div className={styles.tags}>
                  {bio?.priorityTraits?.length > 0 ? (
                    bio.priorityTraits.map((trait, index) => (
                      <span key={index} className={styles.tag}>
                        {trait}
                      </span>
                    ))
                  ) : (
                    <span className={styles.empty}>
                      No priority traits listed
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}