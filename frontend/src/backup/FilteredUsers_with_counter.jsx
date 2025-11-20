import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../components/FilteredUsers.module.css';

export default function FilteredUsers() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [profilePictureUrl, setProfilePictureUrl] = useState('');
    const [hasAvailableUsers, setHasAvailableUsers] = useState(true);
    const [totalMatches, setTotalMatches] = useState(0);
    const [profileCheckComplete, setProfileCheckComplete] = useState(false);
    const [showProfileIncompleteMessage, setShowProfileIncompleteMessage] = useState(false);
    const [fetchTrigger, setFetchTrigger] = useState(0);
    const [userCounter, setUserCounter] = useState(1);

    // Check if user profile is complete
    useEffect(() => {
        const checkProfileCompletion = async () => {
            try {
                const token = localStorage.getItem('token');
                
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

                if (profileRes.ok && bioRes.ok) {
                    const profileData = await profileRes.json();
                    const bioData = await bioRes.json();
                    
                    // Check if essential profile fields are filled
                    const hasEssentialProfileFields = 
                        profileData.displayName && 
                        profileData.displayName.trim() !== '' &&
                        profileData.age && 
                        profileData.gender && 
                        profileData.country && 
                        profileData.country.trim() !== '';
                    
                    // Check if bio has at least some interests
                    const hasInterests = bioData.interests && bioData.interests.length > 0;
                    
                    if (!hasEssentialProfileFields || !hasInterests) {
                        // Show message first, then redirect
                        setShowProfileIncompleteMessage(true);
                        setTimeout(() => {
                            navigate('/profile');
                        }, 2000); // Show message for 2 seconds
                        return;
                    }
                } else {
                    // If we can't fetch profile data, assume it's incomplete
                    setShowProfileIncompleteMessage(true);
                    setTimeout(() => {
                        navigate('/profile');
                    }, 2000);
                    return;
                }
                
                setProfileCheckComplete(true);
            } catch (err) {
                console.error('Error checking profile completion:', err);
                // On error, redirect to edit profile to be safe
                setShowProfileIncompleteMessage(true);
                setTimeout(() => {
                    navigate('/profile');
                }, 2000);
            }
        };

        checkProfileCompletion();
    }, [navigate]);

    useEffect(() => {
        const fetchNextUser = async () => {
            try {
                setLoading(true);
                setError(null);
                const token = localStorage.getItem('token');
                console.log(`Fetching next user (counter: ${userCounter})...`);
                const response = await fetch(`/api/users/next-match`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const userData = await response.json();
                    console.log(`Successfully fetched user:`, userData);
                    setCurrentUser(userData);
                    await fetchProfilePicture(userData.id, token);
                    setHasAvailableUsers(true);
                } else if (response.status === 404) {
                    // No more users
                    console.log(`No more users available`);
                    setHasAvailableUsers(false);
                    setCurrentUser(null);
                } else {
                    throw new Error('Failed to fetch user');
                }
            } catch (err) {
                console.error('Error fetching user:', err);
                setError('Failed to load user');
            } finally {
                setLoading(false);
            }
        };

        // Only fetch users after profile check is complete
        if (profileCheckComplete) {
            fetchNextUser();
        }
    }, [userCounter, profileCheckComplete, fetchTrigger]);

    // Fetch total count on component mount
    useEffect(() => {
        const fetchTotalCount = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/users/filtered/count', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const count = await response.json();
                    setTotalMatches(count);
                }
            } catch (err) {
                console.error('Error fetching total count:', err);
            }
        };

        // Only fetch count after profile check is complete
        if (profileCheckComplete) {
            fetchTotalCount();
        }
    }, [profileCheckComplete]);

    const fetchProfilePicture = async (userId, token) => {
        try {
            const response = await fetch(`/api/files/profile-picture/${userId}`, {
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
            } else {
                setProfilePictureUrl('');
            }
        } catch (error) {
            console.error(`Error fetching profile picture for user ${userId}:`, error);
            setProfilePictureUrl('');
        }
    };

    // Cleanup function to revoke object URL when component unmounts
    useEffect(() => {
        return () => {
            if (profilePictureUrl && profilePictureUrl.startsWith('blob:')) {
                URL.revokeObjectURL(profilePictureUrl);
            }
        };
    }, [profilePictureUrl]);

    const handleLikeUser = async () => {
        if (!currentUser) return;
        
        try {
            // Send like interaction to the API
            const token = localStorage.getItem('token');
            const response = await fetch('/api/likes/interact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    likedUserId: currentUser.id,
                    like: true
                })
            });

            if (!response.ok) {
                throw new Error('Failed to like user');
            }

            const likeResponse = await response.json();
            console.log('Like interaction result:', likeResponse);

            // Get next user
            console.log(`Getting next user`);
            setUserCounter(prev => prev + 1);
            setFetchTrigger(prev => prev + 1);
        } catch (err) {
            console.error('Error liking user:', err);
            // Still get next user even if like fails
            console.log(`Getting next user after error`);
            setUserCounter(prev => prev + 1);
            setFetchTrigger(prev => prev + 1);
        }
    };

    const handlePassUser = async () => {
        if (!currentUser) return;
        
        try {
            // Send dislike interaction to the API
            const token = localStorage.getItem('token');
            const response = await fetch('/api/likes/interact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    likedUserId: currentUser.id,
                    like: false
                })
            });

            if (!response.ok) {
                throw new Error('Failed to dislike user');
            }

            const likeResponse = await response.json();
            console.log('Dislike interaction result:', likeResponse);

            // Get next user
            console.log(`Getting next user (dislike)`);
            setUserCounter(prev => prev + 1);
            setFetchTrigger(prev => prev + 1);
        } catch (err) {
            console.error('Error disliking user:', err);
            // Still get next user even if dislike fails
            console.log(`Getting next user after dislike error`);
            setUserCounter(prev => prev + 1);
            setFetchTrigger(prev => prev + 1);
        }
    };

    if (showProfileIncompleteMessage) {
        return (
            <div 
                className={styles.container}
                style={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '20px'
                }}
            >
                <div className={styles.header}>
                    <h1>Find Your Match</h1>
                </div>
                <div className={styles.noUsers}>
                    <h2>Profile Incomplete</h2>
                    <p>Please complete your profile to start finding matches.</p>
                    <p>Redirecting to profile editor...</p>
                </div>
            </div>
        );
    }

    try {
        return (
            <div 
                className={styles.container}
                style={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '20px'
                }}
            >
                <div className={styles.header}>
                    <h1>Find Your Match</h1>
                </div>
                {loading ? (
                    <div className={styles.loading}>Loading users...</div>
                ) : error ? (
                    <div className={styles.error}>Error: {error}</div>
                ) : !hasAvailableUsers ? (
                    <div className={styles.noUsers}>
                        <h2>You've seen everyone for now</h2>
                        <p>Check back later for more matches!</p>
                    </div>
                ) : !currentUser ? (
                    <div className={styles.noUsers}>
                        <h2>No users available</h2>
                    </div>
                ) : (
                    <>
                        <div className={styles.userGrid}>
                            <div className={styles.userCard}>
                                <div className={styles.profileImageContainer}>
                                    <img 
                                        src={profilePictureUrl || '/default-avatar.png'} 
                                        alt="Profile" 
                                        className={styles.profileImage}
                                        onError={(e) => {
                                            e.target.src = '/default-avatar.png';
                                        }}
                                    />
                                    {currentUser.matchScore !== undefined && (
                                        <div className={styles.matchScore}>
                                            {Math.round(currentUser.matchScore)}% Match
                                        </div>
                                    )}
                                </div>
                                <div className={styles.userInfo}>
                                    <h3 className={styles.userName}>
                                        {currentUser.profile?.displayName || currentUser.displayName || 'Anonymous'}
                                    </h3>
                                    <div className={styles.userDetails}>
                                        Age: {currentUser.profile?.age || currentUser.age || 'Not specified'} • 
                                        Gender: {currentUser.profile?.gender || currentUser.gender || 'Not specified'} • 
                                        Location: {currentUser.profile?.country || currentUser.country || 'Not specified'}
                                    </div>
                                    <div className={styles.userBio}>
                                        {currentUser.profile?.aboutMe || currentUser.aboutMe || 'No description provided'}
                                    </div>
                                    {((currentUser.bio?.interests && currentUser.bio.interests.length > 0) || 
                                      (currentUser.interests && currentUser.interests.length > 0)) && (
                                        <div className={styles.interests}>
                                            {(currentUser.bio?.interests || currentUser.interests || []).map((interest, index) => (
                                                <span key={index} className={styles.interest}>
                                                    {typeof interest === 'string' ? interest : interest.name || interest.type || 'Interest'}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className={styles.actions}>
                                        <button 
                                            className={`${styles.actionButton} ${styles.passButton}`}
                                            onClick={handlePassUser}
                                        >
                                            ✕ Pass
                                        </button>
                                        <button 
                                            className={`${styles.actionButton} ${styles.likeButton}`}
                                            onClick={handleLikeUser}
                                        >
                                            ♥ Like
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
                {currentUser && (
                    <div className={styles.navigation}>
                        <span className={styles.pageInfo}>
                            Match #{userCounter}{totalMatches > 0 ? ` of ${totalMatches}` : ''}
                        </span>
                    </div>
                )}
            </div>
        );
    } catch (error) {
        console.error('Error rendering FilteredUsers:', error);
        return (
            <div 
                className={styles.container}
                style={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '20px'
                }}
            >
                <div className={styles.header}>
                    <h1>Find Your Match</h1>
                </div>
                <div className={styles.error}>
                    <h2>Something went wrong</h2>
                    <p>Error: {error.message}</p>
                    <button onClick={() => window.location.reload()}>Reload Page</button>
                </div>
            </div>
        );
    }
} 