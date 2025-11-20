// src/components/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './RegisterPage.module.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const password = e.target.password.value;
    
    // Basic password validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: e.target.email.value,
          password: password,
        }),
      });

      if (res.ok) {
        // Extract response body with token
        const data = await res.json(); 
        const token = data.token;

        // Store the token (auto-login)
        localStorage.setItem('token', token);

        // Navigate directly to filtered users
        navigate('/find-users');
      } else {
        const errorData = await res.text();
        setError(errorData || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <h1 className={styles.title}>Join Match Me</h1>
        <p className={styles.subtitle}>Create your account to start finding connections</p>
        
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        <form className={styles.form} onSubmit={handleRegister}>
          <div className={styles.inputGroup}>
            <input 
              name="email" 
              type="email" 
              required 
              placeholder="Email address"
              className={styles.input}
              disabled={isLoading}
            />
          </div>
          
          <div className={styles.inputGroup}>
            <input 
              name="password" 
              type="password" 
              required 
              placeholder="Create a password"
              className={styles.input}
              disabled={isLoading}
              onFocus={() => setShowPasswordRequirements(true)}
              onBlur={() => setShowPasswordRequirements(false)}
            />
            {showPasswordRequirements && (
              <div className={styles.passwordRequirements}>
                <strong>Password requirements:</strong>
                <ul>
                  <li>At least 6 characters long</li>
                  <li>Use a mix of letters and numbers for security</li>
                </ul>
              </div>
            )}
          </div>
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <p className={styles.linkText}>
          Already have an account? <Link to="/login" className={styles.link}>Sign in here</Link>
        </p>
      </div>
    </div>
  );
}
