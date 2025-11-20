import React, { useState, useEffect } from 'react';

export default function GetPreferencesTest() {
    const [preferences, setPreferences] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updateMessage, setUpdateMessage] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        minAge: '',
        maxAge: '',
        preferredGenders: new Set(),
        preferredCounties: new Set()
    });

    const fetchPreferences = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/users/me/preferences', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Fetched preferences:', data);
                setPreferences(data);
                // Update form data with current preferences
                setFormData({
                    minAge: data.minAge || '',
                    maxAge: data.maxAge || '',
                    preferredGenders: new Set(data.preferredGenders || []),
                    preferredCounties: new Set(data.preferredCounties || [])
                });
            } else {
                setError('Failed to fetch preferences');
            }
        } catch (err) {
            console.error('Error fetching preferences:', err);
            setError('Error loading preferences');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPreferences();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSetChange = (e, setName) => {
        const { value, checked } = e.target;
        setFormData(prev => {
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
        setUpdateMessage('');
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/users/me/preferences', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    minAge: formData.minAge ? parseInt(formData.minAge) : null,
                    maxAge: formData.maxAge ? parseInt(formData.maxAge) : null,
                    preferredGenders: Array.from(formData.preferredGenders),
                    preferredCounties: Array.from(formData.preferredCounties)
                })
            });

            if (response.ok) {
                setUpdateMessage('Preferences updated successfully!');
                // Refresh preferences
                fetchPreferences();
            } else {
                setUpdateMessage('Failed to update preferences');
            }
        } catch (err) {
            console.error('Error updating preferences:', err);
            setUpdateMessage('Error updating preferences');
        }
    };

    if (loading) return <div>Loading preferences...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h2>User Preferences Test</h2>
            
            {/* Current Preferences Display */}
            {preferences && (
                <div style={{ marginBottom: '20px' }}>
                    <h3>Current Preferences:</h3>
                    <pre>{JSON.stringify(preferences, null, 2)}</pre>
                    <div>
                        <h3>Formatted Data:</h3>
                        <p>Min Age: {preferences.minAge || 'Not set'}</p>
                        <p>Max Age: {preferences.maxAge || 'Not set'}</p>
                        <p>Preferred Genders: {preferences.preferredGenders?.join(', ') || 'Not set'}</p>
                        <p>Preferred Counties: {preferences.preferredCounties?.join(', ') || 'Not set'}</p>
                    </div>
                </div>
            )}

            {/* Update Form */}
            <div style={{ marginTop: '20px' }}>
                <h3>Update Preferences</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                        <label>
                            Min Age:
                            <input
                                type="number"
                                name="minAge"
                                value={formData.minAge}
                                onChange={handleInputChange}
                                min="18"
                                max="100"
                            />
                        </label>
                    </div>

                    <div>
                        <label>
                            Max Age:
                            <input
                                type="number"
                                name="maxAge"
                                value={formData.maxAge}
                                onChange={handleInputChange}
                                min="18"
                                max="100"
                            />
                        </label>
                    </div>

                    <div>
                        <label>Preferred Genders:</label>
                        {['MALE', 'FEMALE', 'OTHER'].map(gender => (
                            <label key={gender} style={{ marginRight: '10px' }}>
                                <input
                                    type="checkbox"
                                    value={gender}
                                    checked={formData.preferredGenders.has(gender)}
                                    onChange={(e) => handleSetChange(e, 'preferredGenders')}
                                />
                                {gender}
                            </label>
                        ))}
                    </div>

                    <div>
                        <label>Preferred Estonian Counties:</label>
                        {['Harju maakond', 'Hiiu maakond', 'Ida-Viru maakond', 'Jõgeva maakond', 'Järva maakond', 'Lääne maakond', 'Lääne-Viru maakond', 'Põlva maakond', 'Pärnu maakond', 'Rapla maakond', 'Saare maakond', 'Tartu maakond', 'Valga maakond', 'Viljandi maakond', 'Võru maakond'].map(county => (
                            <label key={county} style={{ marginRight: '10px' }}>
                                <input
                                    type="checkbox"
                                    value={county}
                                    checked={formData.preferredCounties.has(county)}
                                    onChange={(e) => handleSetChange(e, 'preferredCounties')}
                                />
                                {county}
                            </label>
                        ))}
                    </div>

                    <button type="submit" style={{ marginTop: '10px' }}>Update Preferences</button>
                </form>

                {updateMessage && (
                    <div style={{ marginTop: '10px', color: updateMessage.includes('success') ? 'green' : 'red' }}>
                        {updateMessage}
                    </div>
                )}
            </div>
        </div>
    );
} 