// src/components/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';

export default function LoginPage() {  
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: e.target.email.value,
          password: e.target.password.value,
        }),
      });

      if (res.ok) {
        // Extract response body
        const data = await res.json(); 
        const token = data.token;

        // Store the token
        localStorage.setItem('token', token);

        // Navigate to filtered users
        navigate('/find-users'); 
      } else {
        const errorData = await res.text();
        setError(errorData || 'Login failed. Please try again.');
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
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Sign in to find your perfect match</p>
        
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        <form className={styles.form} onSubmit={handleLogin}>
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
              placeholder="Password"
              className={styles.input}
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <p className={styles.linkText}>
          Don't have an account? <Link to="/register" className={styles.link}>Create one here</Link>
        </p>
      </div>
    </div>
  );
}
