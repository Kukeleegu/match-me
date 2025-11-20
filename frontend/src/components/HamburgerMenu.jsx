import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './HamburgerMenu.module.css';

const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef(null);
  const navigate = useNavigate();

  // Helper: Check if user is logged in
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    closeMenu();
    navigate('/login');
  };

  // Toggle menu
  const toggleMenu = () => {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  // Open menu
  const openMenu = () => {
    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsClosing(false);
    setIsOpen(true);
  };

  // Close menu with smooth animation
  const closeMenu = () => {
    // Prevent multiple close attempts
    if (isClosing || !isOpen) return;
    
    setIsClosing(true);
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      closeTimeoutRef.current = null;
    }, 300); // Match the transition duration
  };

  return (
    <div className={styles.hamburgerContainer}>
      {/* Single hamburger button that transforms in place */}
      <button 
        className={`${styles.hamburgerButton} ${isOpen ? styles.open : ''}`}
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <div className={styles.hamburgerBox}>
          <div className={styles.hamburgerInner}></div>
        </div>
      </button>

      {/* Menu Overlay */}
      {isOpen && (
        <div 
          className={`${styles.menuOverlay} ${isClosing ? styles.closing : ''}`}
          onClick={closeMenu}
        >
          <div 
            className={`${styles.menuContent} ${isClosing ? styles.closing : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <nav className={styles.nav}>
              <ul className={styles.menuList}>
                <li>
                  <Link to="/" onClick={closeMenu}>Home</Link>
                </li>
                
                {!isLoggedIn ? (
                  <li>
                    <Link to="/login" onClick={closeMenu}>Login</Link>
                  </li>
                ) : (
                  <>
                    <li>
                      <Link to="/find-users" onClick={closeMenu}>Find Users</Link>
                    </li>
                    <li>
                      <Link to="/matches" onClick={closeMenu}>My Matches</Link>
                    </li>
                    <li>
                      <Link to="/connection-requests" onClick={closeMenu}>Connection Requests</Link>
                    </li>
                    <li>
                      <Link to="/chat" onClick={closeMenu}>Chat</Link>
                    </li>
                    <li>
                      <Link to="/profile" onClick={closeMenu}>My Profile</Link>
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className={styles.logoutButton}
                      >
                        Logout
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default HamburgerMenu; 