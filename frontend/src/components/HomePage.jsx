// src/components/HomePage.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './SharedStyles.module.css';

export default function HomePage() {
  const navigate = useNavigate();
  
  // Check if user is logged in
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  const handleGetStarted = () => {
    navigate('/find-users');
  };

  return (
    <>
      {/* Main centered welcome box */}
      <div className={styles.container}>
        <div className={styles.centeredBox}>
          <h1>Welcome to Match Me!</h1>
          <p>Find your perfect match and connect with amazing people around you.</p>
          
          {/* Conditional Action Buttons */}
          <div style={{ marginTop: '30px', display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {!isLoggedIn ? (
              <>
                <Link 
                  to="/login" 
                  style={{
                    display: 'inline-block',
                    padding: '15px 30px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '25px',
                    fontWeight: '600',
                    fontSize: '1.1rem',
                    transition: 'all 0.3s ease',
                    minWidth: '120px',
                    textAlign: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  style={{
                    display: 'inline-block',
                    padding: '15px 30px',
                    background: 'transparent',
                    color: '#667eea',
                    textDecoration: 'none',
                    borderRadius: '25px',
                    fontWeight: '600',
                    fontSize: '1.1rem',
                    border: '2px solid #667eea',
                    transition: 'all 0.3s ease',
                    minWidth: '120px',
                    textAlign: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#667eea';
                    e.target.style.color = 'white';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#667eea';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Register
                </Link>
              </>
            ) : (
              <button
                onClick={handleGetStarted}
                style={{
                  padding: '15px 40px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  fontWeight: '600',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: '180px'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Get Started! 🚀
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Additional info section below - outside the main container */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '60px 20px',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          color: 'white'
        }}>
          {/* About Us Section */}
          <div style={{ marginBottom: '50px' }}>
            <h2 style={{ 
              fontSize: '2rem', 
              marginBottom: '20px',
              fontWeight: '700'
            }}>
              About Us
            </h2>
            <p style={{ 
              fontSize: '1.1rem', 
              lineHeight: '1.6', 
              marginBottom: '15px',
              opacity: '0.9'
            }}>
              We are a passionate team dedicated to bringing people together through meaningful connections.
            </p>
            <p style={{ 
              fontSize: '1.1rem', 
              lineHeight: '1.6', 
              marginBottom: '15px',
              opacity: '0.9'
            }}>
              Our mission is to create a safe, inclusive, and enjoyable platform where you can meet like-minded individuals.
            </p>
            <p style={{ 
              fontSize: '1.1rem', 
              lineHeight: '1.6',
              opacity: '0.9'
            }}>
              Learn more about our values of authenticity, respect, and genuine human connection.
            </p>
          </div>
          
          {/* Contact Information */}
          <div>
            <h2 style={{ 
              fontSize: '2rem', 
              marginBottom: '20px',
              fontWeight: '700'
            }}>
              Contact Us
            </h2>
            <p style={{ 
              fontSize: '1.1rem', 
              lineHeight: '1.6', 
              marginBottom: '20px',
              opacity: '0.9'
            }}>
              Have questions or want to get in touch? We'd love to hear from you!
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '30px',
              marginTop: '30px'
            }}>
              <div style={{ opacity: '0.9' }}>
                <strong>📧 Email:</strong><br />
                contact@matchme.com
              </div>
              <div style={{ opacity: '0.9' }}>
                <strong>📞 Phone:</strong><br />
                (555) 123-MATCH
              </div>
              <div style={{ opacity: '0.9' }}>
                <strong>📍 Address:</strong><br />
                123 Connection St<br />
                Love City, USA
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
