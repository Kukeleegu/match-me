import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './EditProfile.module.css';

export default function EditProfile() {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    displayName: '',
    aboutMe: '',
    county: '',
    gender: '',
    age: ''
  });
  const [bioData, setBioData] = useState({
    selectedInterestIds: new Set(),
    favouriteCuisine: '',
    favouriteMusicGenre: '',
    petPreference: '',
    lookingFor: '',
    priorityTraits: new Set()
  });
  const [availableInterests, setAvailableInterests] = useState([]);
  const [interestsLoading, setInterestsLoading] = useState(true);
  const [interestSearchQuery, setInterestSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

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
        
        // Fetch all available interests first
        const interestsRes = await fetch('/api/interests', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Fetch profile data
        const profileRes = await fetch('/api/users/me/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        // Fetch bio data
        const bioRes = await fetch('/api/users/me/bio', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (interestsRes.ok) {
          const interests = await interestsRes.json();
          console.log('Fetched interests:', interests);
          setAvailableInterests(interests);
          setInterestsLoading(false);
        }

        if (profileRes.ok && bioRes.ok) {
          const profileData = await profileRes.json();
          const bioData = await bioRes.json();
          
          console.log('Fetched profile data:', profileData);
          console.log('Fetched bio data:', bioData);
          
                  setProfileData({
          displayName: profileData.displayName || '',
          aboutMe: profileData.aboutMe || '',
          county: profileData.county || '',
          gender: profileData.gender || '',
          age: profileData.age || ''
        });
          
          // Extract interest IDs from the bio data
          const selectedIds = bioData.interests ? 
            new Set(bioData.interests.map(interest => interest.id)) : 
            new Set();
          
          setBioData({
            selectedInterestIds: selectedIds,
            favouriteCuisine: bioData.favouriteCuisine || '',
            favouriteMusicGenre: bioData.favouriteMusicGenre || '',
            petPreference: bioData.petPreference || '',
            lookingFor: bioData.lookingFor || '',
            priorityTraits: new Set(bioData.priorityTraits || [])
          });

          // Always try to fetch profile picture
          fetchProfilePicture(token);
        } else {
          console.error('Profile fetch failed:', await profileRes.text());
          console.error('Bio fetch failed:', await bioRes.text());
          setError('Failed to fetch profile data');
        }
      } catch (err) {
        console.error('Error in fetchUserData:', err);
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

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBioChange = (e) => {
    const { name, value } = e.target;
    setBioData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSetChange = (e, field) => {
    const { value, checked } = e.target;
    setBioData(prev => ({
      ...prev,
      [field]: checked 
        ? new Set([...prev[field], value])
        : new Set([...prev[field]].filter(item => item !== value))
    }));
  };

  const handleInterestChange = (interestId) => {
    setBioData(prev => ({
      ...prev,
      selectedInterestIds: prev.selectedInterestIds.has(interestId)
        ? new Set([...prev.selectedInterestIds].filter(id => id !== interestId))
        : new Set([...prev.selectedInterestIds, interestId])
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');
      
      // Update profile
      const profileRes = await fetch('/api/users/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      // Update bio
      const bioRes = await fetch('/api/users/me/bio', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          interestIds: Array.from(bioData.selectedInterestIds),
          favouriteCuisine: bioData.favouriteCuisine,
          favouriteMusicGenre: bioData.favouriteMusicGenre,
          petPreference: bioData.petPreference,
          lookingFor: bioData.lookingFor,
          priorityTraits: Array.from(bioData.priorityTraits)
        })
      });

      if (profileRes.ok && bioRes.ok) {
        console.log('Profile update successful');
        console.log('Bio update successful');
        
        // Auto-update location preference to match profile location
        if (profileData.county) {
          try {
            await fetch('/api/users/me/preferences', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                preferredCounties: [profileData.county]
              })
            });
          } catch (prefErr) {
            console.error('Error updating location preference:', prefErr);
          }
        }
        
        setSuccess(true);
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      } else {
        const errorData = await profileRes.text();
        console.error('Update failed:', errorData);
        setError(`Update failed: ${errorData}`);
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError('Error updating profile');
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setUploadStatus('');
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('Please select a file first');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setUploadStatus('Please login first');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setUploadStatus('Uploading...');
      const response = await fetch('/api/files/profile-picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.text();
        setUploadStatus('Upload successful!');
        setSelectedFile(null);
        
        // Refresh the profile picture by fetching it again
        const fetchResponse = await fetch('/api/files/profile-picture', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (fetchResponse.ok) {
          const blob = await fetchResponse.blob();
          // Revoke previous URL if it exists
          if (profilePictureUrl) {
            URL.revokeObjectURL(profilePictureUrl);
          }
          const imageUrl = URL.createObjectURL(blob);
          setProfilePictureUrl(imageUrl);
        }
      } else {
        const error = await response.text();
        setUploadStatus('Upload failed: ' + error);
      }
    } catch (error) {
      setUploadStatus('Error: ' + error.message);
    }
  };

  if (error) {
    return <div className={styles.errorMessage}>Error: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <h1>Edit Profile</h1>
      {success && <div className={styles.successMessage}>Profile updated successfully!</div>}
      
      <form onSubmit={handleSubmit}>
        <div className={styles.profileSection}>
          <h2>Basic Information</h2>
          <div className={styles.formGroup}>
            <label htmlFor="displayName">Display Name:</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={profileData.displayName}
              onChange={handleProfileChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="gender">Gender:</label>
            <select
              id="gender"
              name="gender"
              value={profileData.gender}
              onChange={handleProfileChange}
              required
            >
              <option value="">Select gender...</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="age">Age:</label>
            <input
              type="number"
              id="age"
              name="age"
              value={profileData.age}
              onChange={handleProfileChange}
              min="18"
              max="120"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Current Profile Picture:</label>
            <div className={styles.currentAvatar}>
              <img 
                src={profilePictureUrl || '/default-avatar.png'} 
                alt="Current Profile"
                className={styles.currentAvatar__image}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Upload New Profile Picture:</label>
            <div className={styles.fileUploadSection}>
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/gif,image/webp"
              />
              <button type="button" onClick={handleFileUpload}>
                Upload Image
              </button>
              {uploadStatus && <p className={styles.uploadStatus}>{uploadStatus}</p>}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="aboutMe">About Me:</label>
            <textarea
              id="aboutMe"
              name="aboutMe"
              value={profileData.aboutMe}
              onChange={handleProfileChange}
              rows="4"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="county">Estonian County:</label>
            <select
              id="county"
              name="county"
              value={profileData.county}
              onChange={handleProfileChange}
              required
            >
              <option value="">Select a county...</option>
              <option value="Harju maakond">Harju maakond</option>
              <option value="Hiiu maakond">Hiiu maakond</option>
              <option value="Ida-Viru maakond">Ida-Viru maakond</option>
              <option value="Jõgeva maakond">Jõgeva maakond</option>
              <option value="Järva maakond">Järva maakond</option>
              <option value="Lääne maakond">Lääne maakond</option>
              <option value="Lääne-Viru maakond">Lääne-Viru maakond</option>
              <option value="Põlva maakond">Põlva maakond</option>
              <option value="Pärnu maakond">Pärnu maakond</option>
              <option value="Rapla maakond">Rapla maakond</option>
              <option value="Saare maakond">Saare maakond</option>
              <option value="Tartu maakond">Tartu maakond</option>
              <option value="Valga maakond">Valga maakond</option>
              <option value="Viljandi maakond">Viljandi maakond</option>
              <option value="Võru maakond">Võru maakond</option>
            </select>
          </div>
        </div>

        <div className={styles.bioSection}>
          <h2>Preferences & Interests</h2>
          <div className={styles.formGroup}>
            <label>Interests:</label>
            {interestsLoading ? (
              <div className={styles.loading}>Loading interests...</div>
            ) : (
              <div>
                <div className={styles.searchContainer}>
                  <input
                    type="text"
                    placeholder="Search interests..."
                    value={interestSearchQuery}
                    onChange={(e) => setInterestSearchQuery(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
                <div className={styles.selectedCount}>
                  {bioData.selectedInterestIds.size} interests selected
                </div>
                <div className={styles.interestsContainer}>
                  {/* Group interests by category and filter by search */}
                  {Object.entries(
                    availableInterests
                      .filter(interest => 
                        interest.name.toLowerCase().includes(interestSearchQuery.toLowerCase()) ||
                        interest.category.toLowerCase().includes(interestSearchQuery.toLowerCase())
                      )
                      .reduce((acc, interest) => {
                        const category = interest.category || 'Other';
                        if (!acc[category]) acc[category] = [];
                        acc[category].push(interest);
                        return acc;
                      }, {})
                  ).map(([category, interests]) => (
                    <div key={category} className={styles.categoryGroup}>
                      <h4 className={styles.categoryTitle}>{category}</h4>
                      <div className={styles.checkboxGroup}>
                        {interests.map(interest => (
                          <label key={interest.id} className={styles.interestLabel}>
                            <input
                              type="checkbox"
                              checked={bioData.selectedInterestIds.has(interest.id)}
                              onChange={() => handleInterestChange(interest.id)}
                            />
                            <span className={styles.interestName}>{interest.name}</span>
                            <span className={styles.interestMeta}>
                              {interest.type === 'ACTIVITY' ? '🏃' : '🎯'} 
                              {interest.mood && ` ${interest.mood.toLowerCase()}`}
                              {interest.physical && ' • physical'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="favouriteCuisine">Favorite Cuisine:</label>
            <input
              type="text"
              id="favouriteCuisine"
              name="favouriteCuisine"
              value={bioData.favouriteCuisine}
              onChange={handleBioChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="favouriteMusicGenre">Favorite Music Genre:</label>
            <select
              id="favouriteMusicGenre"
              name="favouriteMusicGenre"
              value={bioData.favouriteMusicGenre}
              onChange={handleBioChange}
            >
              <option value="">Select...</option>
              {[
                'Pop',
                'Rock',
                'Hip Hop',
                'Jazz',
                'Classical',
                'Country',
                'Electronic',
                'R&B',
                'Reggae',
                'Metal'
              ].map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="petPreference">Pet Preference:</label>
            <select
              id="petPreference"
              name="petPreference"
              value={bioData.petPreference}
              onChange={handleBioChange}
            >
              <option value="">Select...</option>
              <option value="Dogs">Dogs</option>
              <option value="Cats">Cats</option>
              <option value="Other">Other</option>
              <option value="None">No Pets</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="lookingFor">Looking For:</label>
            <select
              id="lookingFor"
              name="lookingFor"
              value={bioData.lookingFor}
              onChange={handleBioChange}
            >
              <option value="">Select...</option>
              <option value="Friendship">Friendship</option>
              <option value="Relationship">Relationship</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Priority Traits:</label>
            <div className={styles.checkboxGroup}>
              {['Honesty', 'Kindness', 'Intelligence', 'Humor', 'Ambition'].map(trait => (
                <label key={trait}>
                  <input
                    type="checkbox"
                    value={trait}
                    checked={bioData.priorityTraits.has(trait)}
                    onChange={(e) => handleSetChange(e, 'priorityTraits')}
                  />
                  {trait}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="submit">Save Changes</button>
          <button type="button" onClick={() => navigate('/profile')}>Cancel</button>
        </div>
      </form>
    </div>
  );
} 