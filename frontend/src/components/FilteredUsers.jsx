import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    const [userCounter, setUserCounter] = useState(1);
    
    // Enhanced animation and loading states
    const [swipeAnimation, setSwipeAnimation] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);
    const [userKey, setUserKey] = useState(0); // Keep for DOM recreation safety
    const [shouldShowEntryAnimation, setShouldShowEntryAnimation] = useState(false);
    const [isLoadingNewUser, setIsLoadingNewUser] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [contentReady, setContentReady] = useState(false);
    const [isWaitingToAnimate, setIsWaitingToAnimate] = useState(false);
    const entryAnimationRef = useRef(false);
    const currentUserIdRef = useRef(null);
    const imageRef = useRef(null);

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
                        profileData.county && 
                        profileData.county.trim() !== '';
                    
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

    // Verify content is fully ready for animation
    const verifyContentReady = useCallback(() => {
        return new Promise((resolve) => {
            const checkReady = () => {
                if (imageRef.current) {
                    // Check if image is loaded and has dimensions
                    const img = imageRef.current;
                    const isImageReady = img.complete && img.naturalWidth > 0;
                    
                    if (isImageReady || imageError) {
                        resolve(true);
                    } else {
                        // Wait a bit more and check again
                        setTimeout(checkReady, 50);
                    }
                } else {
                    // No image ref, wait a bit
                    setTimeout(checkReady, 50);
                }
            };
            
            checkReady();
            
            // Timeout after 2 seconds to prevent infinite waiting
            setTimeout(() => resolve(true), 2000);
        });
    }, [imageError]);



    // Comprehensive user loading with verification
    const fetchNextUser = useCallback(async (showEntrance = false) => {
        try {
            // Set loading state for new user
            setIsLoadingNewUser(true);
            setImageLoaded(false);
            setImageError(false);
            setContentReady(false);
            setShouldShowEntryAnimation(false);
            entryAnimationRef.current = false;
            
            if (!currentUser) {
                setLoading(true);
            }
            setError(null);
            const token = localStorage.getItem('token');
            
            const response = await fetch(`/api/users/next-match`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const userData = await response.json();
                console.log(`Successfully fetched user:`, userData);
                
                // Load and verify profile picture
                let imageUrl = '';
                let imageLoadSuccess = false;
                
                try {
                    const pictureResponse = await fetch(`/api/files/profile-picture/${userData.id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (pictureResponse.ok) {
                        const blob = await pictureResponse.blob();
                        // Clean up previous URL
                        if (profilePictureUrl && profilePictureUrl.startsWith('blob:')) {
                            URL.revokeObjectURL(profilePictureUrl);
                        }
                        imageUrl = URL.createObjectURL(blob);
                        
                        // Verify image loads properly
                        imageLoadSuccess = await new Promise((resolve) => {
                            const img = new Image();
                            img.onload = () => resolve(true);
                            img.onerror = () => resolve(false);
                            img.src = imageUrl;
                            // Timeout after 5 seconds
                            setTimeout(() => resolve(false), 5000);
                        });
                    }
                } catch (error) {
                    console.error(`Error fetching profile picture for user ${userData.id}:`, error);
                }
                
                // Update ref to track current user
                currentUserIdRef.current = userData.id;
                
                // Handle entrance animation differently
                if (showEntrance) {
                    // Set user data immediately but mark as waiting to animate
                    setCurrentUser(userData);
                    setUserKey(prev => prev + 1); // Force DOM recreation for safety
                    setHasAvailableUsers(true);
                    setProfilePictureUrl(imageUrl);
                    setImageLoaded(imageLoadSuccess);
                    setImageError(!imageLoadSuccess && !imageUrl);
                    setIsLoadingNewUser(false);
                    setIsWaitingToAnimate(true); // Hide the card initially
                    
                    // Wait for complete DOM recreation and rendering cycle
                    requestAnimationFrame(() => {
                        requestAnimationFrame(async () => {
                            // Wait for content to be fully ready
                            await verifyContentReady();
                            
                            // Additional timeout to ensure React has finished all updates
                            setTimeout(() => {
                                // Verify this is still the current user (prevent race conditions)
                                if (currentUserIdRef.current === userData.id) {
                                    setContentReady(true);
                                    entryAnimationRef.current = true;
                                    // Simultaneously show the card and start animation
                                    setIsWaitingToAnimate(false);
                                    setShouldShowEntryAnimation(true);
                                    
                                    // Auto-clear animation after it completes to prevent re-triggers
                                    setTimeout(() => {
                                        if (currentUserIdRef.current === userData.id) {
                                            setShouldShowEntryAnimation(false);
                                            entryAnimationRef.current = false;
                                        }
                                    }, 550); // Slightly longer than CSS animation (500ms)
                                }
                            }, 50); // Reduced delay since we've verified content is ready
                        });
                    });
                } else {
                    // For initial load, set data immediately
                    setCurrentUser(userData);
                    setUserKey(prev => prev + 1); // Force DOM recreation for safety
                    setHasAvailableUsers(true);
                    setProfilePictureUrl(imageUrl);
                    setImageLoaded(imageLoadSuccess);
                    setImageError(!imageLoadSuccess && !imageUrl);
                    setIsLoadingNewUser(false);
                    setIsWaitingToAnimate(false);
                }
                
            } else if (response.status === 404) {
                // No more users
                console.log(`No more users available`);
                if (showEntrance) {
                    // Delay clearing the current user to prevent flash
                    setTimeout(() => {
                        setHasAvailableUsers(false);
                        setCurrentUser(null);
                        setProfilePictureUrl('');
                        setImageLoaded(false);
                        setImageError(false);
                        setContentReady(false);
                        setIsLoadingNewUser(false);
                        setShouldShowEntryAnimation(false);
                        setIsWaitingToAnimate(false);
                        entryAnimationRef.current = false;
                        currentUserIdRef.current = null;
                    }, 100);
                } else {
                    setHasAvailableUsers(false);
                    setCurrentUser(null);
                    setProfilePictureUrl('');
                    setImageLoaded(false);
                    setImageError(false);
                    setContentReady(false);
                    setIsLoadingNewUser(false);
                    setShouldShowEntryAnimation(false);
                    setIsWaitingToAnimate(false);
                    entryAnimationRef.current = false;
                    currentUserIdRef.current = null;
                }
            } else {
                throw new Error('Failed to fetch user');
            }
        } catch (err) {
            console.error('Error fetching user:', err);
            setIsLoadingNewUser(false);
            setIsWaitingToAnimate(false);
            if (!currentUser) {
                setError('Failed to load user');
            }
        } finally {
            if (!currentUser) {
                setLoading(false);
            }
        }
    }, [currentUser, profilePictureUrl, hasAvailableUsers]);

    useEffect(() => {
        // Fetch initial user after profile check is complete
        if (profileCheckComplete && !currentUser && hasAvailableUsers) {
            entryAnimationRef.current = false; // Ensure no animation on initial load
            setContentReady(false);
            setIsWaitingToAnimate(false);
            fetchNextUser(false);
        }
    }, [profileCheckComplete, currentUser, hasAvailableUsers, fetchNextUser]);

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



    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (profilePictureUrl && profilePictureUrl.startsWith('blob:')) {
                URL.revokeObjectURL(profilePictureUrl);
            }
            // Clear any pending timeouts/animations
            setShouldShowEntryAnimation(false);
            setIsWaitingToAnimate(false);
            entryAnimationRef.current = false;
        };
    }, [profilePictureUrl]);

    const handleLikeUser = async () => {
        if (!currentUser || isAnimating || isLoadingNewUser) return;
        
        const userToLike = currentUser;
        
        // Clear all animation states and start swipe right animation
        setShouldShowEntryAnimation(false);
        setIsWaitingToAnimate(false);
        entryAnimationRef.current = false;
        setIsAnimating(true);
        setSwipeAnimation('swipeRight');
        
        // Wait for animation to complete, then prepare for next user
        setTimeout(() => {
            // Clear animation class but keep current user visible to prevent flash
            setSwipeAnimation('');
            
            // Immediately start fetching next user while current user is still visible
            setUserCounter(prev => prev + 1);
            setIsAnimating(false);
            fetchNextUser(true);
        }, 500); // 500ms animation duration to match CSS
        
        // Send like interaction to the API in the background
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/likes/interact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    likedUserId: userToLike.id,
                    like: true
                })
            });

            if (!response.ok) {
                throw new Error('Failed to like user');
            }

            const likeResponse = await response.json();
            console.log('Like interaction result:', likeResponse);
        } catch (err) {
            console.error('Error liking user:', err);
        }
    };

    const handlePassUser = async () => {
        if (!currentUser || isAnimating || isLoadingNewUser) return;
        
        const userToPass = currentUser;
        
        // Clear all animation states and start swipe left animation
        setShouldShowEntryAnimation(false);
        setIsWaitingToAnimate(false);
        entryAnimationRef.current = false;
        setIsAnimating(true);
        setSwipeAnimation('swipeLeft');
        
        // Wait for animation to complete, then prepare for next user
        setTimeout(() => {
            // Clear animation class but keep current user visible to prevent flash
            setSwipeAnimation('');
            
            // Immediately start fetching next user while current user is still visible
            setUserCounter(prev => prev + 1);
            setIsAnimating(false);
            fetchNextUser(true);
        }, 500); // 500ms animation duration to match CSS
        
        // Send dislike interaction to the API in the background
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/likes/interact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    likedUserId: userToPass.id,
                    like: false
                })
            });

            if (!response.ok) {
                throw new Error('Failed to dislike user');
            }

            const likeResponse = await response.json();
            console.log('Dislike interaction result:', likeResponse);
        } catch (err) {
            console.error('Error disliking user:', err);
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
            {error ? (
                <div className={styles.error}>Error: {error}</div>
            ) : !hasAvailableUsers ? (
                <div className={styles.noUsers}>
                    <h2>You've seen everyone for now</h2>
                    <p>Check back later for more matches!</p>
                </div>
            ) : !currentUser || isLoadingNewUser ? (
                loading || isLoadingNewUser ? (
                    <div className={styles.loading}>
                        {isLoadingNewUser ? 'Loading next match...' : 'Loading users...'}
                    </div>
                ) : null
            ) : (
                <div className={styles.userGrid}>
                    <div className={`${styles.userCard} ${
                        isLoadingNewUser ? styles.userCard__loading : 
                        isWaitingToAnimate ? styles.userCard__hidden : 
                        shouldShowEntryAnimation ? styles.userCard__entrance : ''
                    } ${swipeAnimation ? styles[`userCard__${swipeAnimation}`] : ''}`} key={userKey}>
                        <div className={styles.userCard__image}>
                            <img 
                                ref={imageRef}
                                src={profilePictureUrl || '/default-avatar.png'} 
                                alt="User Profile"
                                onLoad={() => setImageLoaded(true)}
                                onError={() => setImageError(true)}
                            />
                        </div>
                        <div className={styles.userCard__content}>
                            <h2 className={styles.userCard__name}>{currentUser.profile?.displayName || 'Unknown'}</h2>
                            <p className={styles.userCard__text}>Age: {currentUser.profile?.age || 'Not specified'}</p>
                            <p className={styles.userCard__text}>Gender: {currentUser.profile?.gender || 'Not specified'}</p>
                            <p className={styles.userCard__text}>Location: {currentUser.profile?.county || 'Not specified'}</p>
                            <p className={styles.userCard__about}>{currentUser.profile?.aboutMe || 'No description provided'}</p>
                            {currentUser.matchDetails && (
                                <div className={styles.matchDetails}>
                                    <h4 className={styles.matchDetails__title}>Why you match:</h4>
                                    <p className={styles.matchDetails__text}>{currentUser.matchDetails}</p>
                                </div>
                            )}
                            
                            {/* Navigation buttons inside the card */}
                            <div className={styles.navigationButtons}>
                                <button 
                                    className={`${styles.navButton} ${styles.navButton__previous}`}
                                    onClick={handlePassUser}
                                    disabled={isAnimating}
                                >
                                    ✕ Pass
                                </button>
                                <button 
                                    className={`${styles.navButton} ${styles.navButton__next}`}
                                    onClick={handleLikeUser}
                                    disabled={isAnimating}
                                >
                                    ♥ Like
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Floating Action Buttons */}
            <div className={styles.floatingButtons}>
                <button 
                    className={styles.floatingButton}
                    onClick={() => navigate('/chat')}
                    title="Chat with your matches"
                >
                    💬
                </button>
                <button 
                    className={styles.floatingButton}
                    onClick={() => navigate('/matches')}
                    title="View your matches"
                >
                    ❤️
                </button>
            </div>
        </div>
    );
} 