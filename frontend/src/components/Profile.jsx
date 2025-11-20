// src/components/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Profile.module.css';

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const navigate = useNavigate();

  // Cleanup function to revoke object URL when component unmounts or URL changes
  useEffect(() => {
    return () => {
      if (profilePictureUrl) {
        URL.revokeObjectURL(profilePictureUrl);
      }
    };
  }, [profilePictureUrl]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          console.log('Fetched user data:', data);
          setUserData(data);
          
          // Always try to fetch profile picture
          fetchProfilePicture(token);
        } else {
          setError('Failed to fetch profile data: ' + res.status);
        }
      } catch {
        setError('Error loading profile');
      }
    };

    const fetchProfilePicture = async (token) => {
      try {
        const response = await fetch('/api/files/profile-picture', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const blob = await response.blob();
          // Revoke previous URL if it exists
          if (profilePictureUrl) {
            URL.revokeObjectURL(profilePictureUrl);
          }
          const imageUrl = URL.createObjectURL(blob);
          setProfilePictureUrl(imageUrl);
        } else if (response.status === 404) {
          // No profile picture found, which is fine
          setProfilePictureUrl('');
        }
      } catch (error) {
        console.error('Error fetching profile picture:', error);
        // Don't set error state for profile picture issues
      }
    };

    fetchUserData();
  }, []);

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  if (!userData) {
    return <div className={styles.loading}>Loading...</div>;
  }

  const { profile, bio } = userData;

  return (
    <div className={styles.container}>
      <div className={styles.profileCard}>
        <div className={styles.header}>
          <h1 className={styles.header__title}>Your Profile</h1>
          <div className={styles.actions}>
            <Link to="/profile/edit" className={styles.editButton}>Edit Profile</Link>
            <Link to="/edit-preferences" className={styles.editButton}>Edit Preferences</Link>
          </div>
        </div>

        <div className={styles.content}>
        <div className={styles.section}>
          <h2 className={styles.section__title}>Basic Information</h2>
          <div className={styles.info}>
                            <div className={styles.avatar}>
                    <img 
                        src={profilePictureUrl || '/default-avatar.png'} 
                        alt="Profile" 
                        className={styles.avatar__image}
                    />
                </div>
            <div className={styles.basicInfoGrid}>
              <div className={styles.basicInfoColumn}>
                <div className={styles.infoItem}>
                  <label className={styles.infoItem__label}>Display Name:</label>
                  <span className={styles.infoItem__value}>{profile?.displayName || 'Not set'}</span>
                </div>
                <div className={styles.infoItem}>
                  <label className={styles.infoItem__label}>Email:</label>
                  <span className={styles.infoItem__value}>{userData.email}</span>
                </div>
                <div className={styles.infoItem}>
                  <label className={styles.infoItem__label}>Gender:</label>
                  <span className={styles.infoItem__value}>{profile?.gender || 'Not specified'}</span>
                </div>
              </div>
              <div className={styles.basicInfoColumn}>
                <div className={styles.infoItem}>
                  <label className={styles.infoItem__label}>Age:</label>
                  <span className={styles.infoItem__value}>{profile?.age || 'Not specified'}</span>
                </div>
                <div className={styles.infoItem}>
                  <label className={styles.infoItem__label}>Location:</label>
                  <span className={styles.infoItem__value}>{profile?.county || 'Not set'}</span>
                </div>
              </div>
            </div>
            <div className={`${styles.infoItem} ${styles.infoItem_fullWidth} ${styles.infoItem_aboutMe}`}>
              <label className={styles.infoItem__label}>About Me:</label>
              <p className={styles.infoItem__text}>{profile?.aboutMe || 'No description provided'}</p>
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
                        {interest.type === 'ACTIVITY' ? ' 🏃' : ' 🎯'}
                      </span>
                    </span>
                  ))
                ) : (
                  <span className={styles.empty}>No interests listed</span>
                )}
              </div>
            </div>

            <div className={styles.infoItem}>
              <label className={styles.infoItem__label}>Favorite Cuisine:</label>
              <span className={styles.infoItem__value}>{bio?.favouriteCuisine || 'Not specified'}</span>
            </div>

            <div className={styles.infoItem}>
              <label className={styles.infoItem__label}>Favorite Music Genre:</label>
              <span className={styles.infoItem__value}>{bio?.favouriteMusicGenre || 'Not specified'}</span>
            </div>



            <div className={styles.infoItem}>
              <label className={styles.infoItem__label}>Pet Preference:</label>
              <span className={styles.infoItem__value}>{bio?.petPreference || 'Not specified'}</span>
            </div>

            <div className={styles.infoItem}>
              <label className={styles.infoItem__label}>Looking For:</label>
              <span className={styles.infoItem__value}>{bio?.lookingFor || 'Not specified'}</span>
            </div>

            <div className={`${styles.infoItem} ${styles.infoItem_fullWidth}`}>
              <label className={styles.infoItem__label}>Priority Traits:</label>
              <div className={styles.tags}>
                {bio?.priorityTraits?.length > 0 ? (
                  bio.priorityTraits.map((trait, index) => (
                    <span key={index} className={styles.tag}>{trait}</span>
                  ))
                ) : (
                  <span className={styles.empty}>No priority traits listed</span>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
      
      {/* Floating Action Button */}
      <div className={styles.floatingButtons}>
        <button 
          className={styles.floatingButton}
          onClick={() => navigate('/find-users')}
          title="Find new users"
        >
          🔍
        </button>
      </div>
    </div>
  );
}
