import { useState, useEffect } from 'react';

function FileUploadTest() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');
    const [profilePictureUrl, setProfilePictureUrl] = useState('');
    const [retrievalStatus, setRetrievalStatus] = useState('');

    // Cleanup function to revoke object URL when component unmounts or URL changes
    useEffect(() => {
        return () => {
            if (profilePictureUrl) {
                URL.revokeObjectURL(profilePictureUrl);
            }
        };
    }, [profilePictureUrl]);

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleUpload = async () => {
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
            const response = await fetch('/api/files/profile-picture', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const result = await response.text();
                setUploadStatus('Upload successful: ' + result);
                // Clear the previous profile picture after successful upload
                if (profilePictureUrl) {
                    URL.revokeObjectURL(profilePictureUrl);
                }
                setProfilePictureUrl('');
                setRetrievalStatus('');
            } else {
                const error = await response.text();
                setUploadStatus('Upload failed: ' + error);
            }
        } catch (error) {
            setUploadStatus('Error: ' + error.message);
        }
    };

    const handleRetrieveProfilePicture = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setRetrievalStatus('Please login first');
            return;
        }

        try {
            const response = await fetch('/api/files/profile-picture', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Create a blob URL for the image
                const blob = await response.blob();
                // Revoke previous URL if it exists
                if (profilePictureUrl) {
                    URL.revokeObjectURL(profilePictureUrl);
                }
                const imageUrl = URL.createObjectURL(blob);
                setProfilePictureUrl(imageUrl);
                setRetrievalStatus('Profile picture retrieved successfully');
            } else if (response.status === 404) {
                setRetrievalStatus('No profile picture found');
                if (profilePictureUrl) {
                    URL.revokeObjectURL(profilePictureUrl);
                }
                setProfilePictureUrl('');
            } else {
                const error = await response.text();
                setRetrievalStatus('Retrieval failed: ' + error);
                if (profilePictureUrl) {
                    URL.revokeObjectURL(profilePictureUrl);
                }
                setProfilePictureUrl('');
            }
        } catch (error) {
            setRetrievalStatus('Error: ' + error.message);
            if (profilePictureUrl) {
                URL.revokeObjectURL(profilePictureUrl);
            }
            setProfilePictureUrl('');
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Test File Upload & Retrieval</h2>
            
            <div style={{ marginBottom: '20px' }}>
                <h3>Upload Profile Picture</h3>
                <input 
                    type="file" 
                    onChange={handleFileChange} 
                    accept="image/jpeg,image/png,image/gif,image/webp"
                />
                <button onClick={handleUpload} style={{ marginLeft: '10px' }}>
                    Upload
                </button>
                {uploadStatus && <p style={{ color: uploadStatus.includes('successful') ? 'green' : 'red' }}>
                    {uploadStatus}
                </p>}
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h3>Retrieve Profile Picture</h3>
                <button onClick={handleRetrieveProfilePicture}>
                    Get Profile Picture
                </button>
                {retrievalStatus && <p style={{ color: retrievalStatus.includes('successfully') ? 'green' : 'red' }}>
                    {retrievalStatus}
                </p>}
            </div>

            {profilePictureUrl && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Current Profile Picture</h3>
                    <img 
                        src={profilePictureUrl} 
                        alt="Profile" 
                        style={{ 
                            maxWidth: '300px', 
                            maxHeight: '300px', 
                            border: '1px solid #ccc',
                            borderRadius: '8px'
                        }} 
                    />
                </div>
            )}
        </div>
    );
}

export default FileUploadTest; 