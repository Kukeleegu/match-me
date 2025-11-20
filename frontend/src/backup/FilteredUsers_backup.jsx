import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './FilteredUsers.module.css';

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
            <div className={styles.container}>
                <h1 className={styles.title}>Find Users</h1>
                <div className={styles.profileIncompleteMessage}>
                    <h2>Profile Incomplete</h2>
                    <p>Please complete your profile to start finding matches.</p>
                    <p>Redirecting to profile editor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Find Users</h1>
            {loading ? (
                <div>Loading users...</div>
            ) : error ? (
                <h2 className={styles.error}>Error: {error}</h2>
            ) : !hasAvailableUsers ? (
                <div className={styles.noMatches}>
                    <h2>You've seen everyone for now</h2>
                    <p>Check back later for more matches!</p>
                </div>
            ) : !currentUser ? (
                <h2 className={styles.noMatches}>No users available</h2>
            ) : (
                <>
                    <div className={styles.progressIndicator}>
                        <span>Match #{userCounter}{totalMatches > 0 ? ` of ${totalMatches}` : ''}</span>
                    </div>
                    <div className={styles.userCard}>
                        <div className={styles.userCard__profilePicture}>
                            <img 
                                src={profilePictureUrl || '/default-avatar.png'} 
                                alt="Profile" 
                                className={styles.userCard__profileImage}
                            />
                        </div>
                        <div className={styles.userCard__header}>
                            <h3 className={styles.userCard__title}>{currentUser.profile?.displayName || 'Anonymous'}</h3>
                            {currentUser.matchScore !== undefined && (
                                <div className={styles.matchScore}>
                                    <span className={styles.matchScore__percentage}>
                                        {Math.round(currentUser.matchScore)}%
                                    </span>
                                    <span className={styles.matchScore__label}>Match</span>
                                </div>
                            )}
                        </div>
                        <p className={styles.userCard__text}>Age: {currentUser.profile?.age || 'Not specified'}</p>
                        <p className={styles.userCard__text}>Gender: {currentUser.profile?.gender || 'Not specified'}</p>
                        <p className={styles.userCard__text}>Location: {currentUser.profile?.country || 'Not specified'}</p>
                        <p className={styles.userCard__about}>{currentUser.profile?.aboutMe || 'No description provided'}</p>
                        {currentUser.matchDetails && (
                            <div className={styles.matchDetails}>
                                <h4 className={styles.matchDetails__title}>Why you match:</h4>
                                <p className={styles.matchDetails__text}>{currentUser.matchDetails}</p>
                            </div>
                        )}
                    </div>
                    <div className={styles.navigationButtons}>
                        <button 
                            className={`${styles.navButton} ${styles.navButton__previous}`}
                            onClick={handlePassUser}
                        >
                            ✕ Pass
                        </button>
                        <button 
                            className={`${styles.navButton} ${styles.navButton__next}`}
                            onClick={handleLikeUser}
                        >
                            ♥ Like
                        </button>
                    </div>
                </>
            )}
        </div>
    );
} 