import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './EditPreferences.module.css';

export default function EditPreferences() {
    const navigate = useNavigate();
    const [preferences, setPreferences] = useState({
        minAge: '',
        maxAge: '',
        preferredGenders: new Set(),
        preferredCounties: new Set()
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/users/me/preferences', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch preferences');
            }

            const data = await response.json();
            setPreferences({
                minAge: data.minAge || '',
                maxAge: data.maxAge || '',
                preferredGenders: new Set(data.preferredGenders || []),
                preferredCounties: new Set(data.preferredCounties || [])
            });
        } catch (err) {
            console.error('Error fetching preferences:', err);
            setError('Failed to load preferences');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPreferences(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSetChange = (e, setName) => {
        const { value, checked } = e.target;
        setPreferences(prev => {
            const newSet = new Set(prev[setName]);
            if (checked) {
                newSet.add(value);
            } else {
                newSet.delete(value);
            }
            return {
                ...prev,
                [setName]: newSet
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccess(false);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/users/me/preferences', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    minAge: preferences.minAge ? parseInt(preferences.minAge) : null,
                    maxAge: preferences.maxAge ? parseInt(preferences.maxAge) : null,
                    preferredGenders: Array.from(preferences.preferredGenders),
                    preferredCounties: Array.from(preferences.preferredCounties)
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update preferences');
            }

            setSuccess(true);
            
            // Redirect to profile page after a brief delay to show success message
            setTimeout(() => {
                navigate('/profile');
            }, 1500);
        } catch (err) {
            console.error('Error updating preferences:', err);
            setError('Failed to update preferences');
        }
    };

    if (loading) return <div>Loading preferences...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className={styles.container}>
            <h2>Edit Preferences</h2>
            
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label className={styles.formGroup__label}>Age Range:</label>
                    <div className={styles.ageInputs}>
                        <input
                            type="number"
                            name="minAge"
                            value={preferences.minAge}
                            onChange={handleInputChange}
                            placeholder="Min Age"
                            min="18"
                            max="100"
                            className={styles.ageInputs__input}
                        />
                        <input
                            type="number"
                            name="maxAge"
                            value={preferences.maxAge}
                            onChange={handleInputChange}
                            placeholder="Max Age"
                            min="18"
                            max="100"
                            className={styles.ageInputs__input}
                        />
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.formGroup__label}>Preferred Genders:</label>
                    <div className={styles.checkboxGroup}>
                        {['MALE', 'FEMALE', 'OTHER'].map(gender => (
                            <label key={gender} className={styles.checkboxGroup__label}>
                                <input
                                    type="checkbox"
                                    value={gender}
                                    checked={preferences.preferredGenders.has(gender)}
                                    onChange={(e) => handleSetChange(e, 'preferredGenders')}
                                    className={styles.checkboxGroup__input}
                                />
                                {gender}
                            </label>
                        ))}
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.formGroup__label}>Preferred Estonian Counties:</label>
                    <div className={styles.checkboxGroup}>
                        {[
                            'Harju maakond', 'Hiiu maakond', 'Ida-Viru maakond', 'Jõgeva maakond', 'Järva maakond',
                            'Lääne maakond', 'Lääne-Viru maakond', 'Põlva maakond', 'Pärnu maakond', 'Rapla maakond',
                            'Saare maakond', 'Tartu maakond', 'Valga maakond', 'Viljandi maakond', 'Võru maakond'
                        ].map(county => (
                            <label key={county} className={styles.checkboxGroup__label}>
                                <input
                                    type="checkbox"
                                    value={county}
                                    checked={preferences.preferredCounties.has(county)}
                                    onChange={(e) => handleSetChange(e, 'preferredCounties')}
                                    className={styles.checkboxGroup__input}
                                />
                                {county}
                            </label>
                        ))}
                    </div>
                </div>

                <button type="submit" className={styles.submitButton}>Save Preferences</button>
            </form>

            {success && (
                <div className={styles.successMessage}>
                    Preferences updated successfully!
                </div>
            )}
        </div>
    );
} 