// src/UploadForm.js
import React, { useState } from 'react';
import axios from 'axios';

function UploadForm({ setImage }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [enhancedURL, setEnhancedURL] = useState(null);

  const handleChoose = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setPreviewURL(URL.createObjectURL(file));
    setEnhancedURL(null); // reset hasil jika upload ulang
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreviewURL(null);
    setEnhancedURL(null);
    setImage(null);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const res = await axios.post('http://127.0.0.1:5000/upload', formData, {
        responseType: 'blob',
      });
      const imageURL = URL.createObjectURL(res.data);
      setEnhancedURL(imageURL);
      setImage(imageURL);
    } catch (err) {
      alert('Enhance failed');
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.column}>
        {!previewURL ? (
          <>
            <input type="file" accept="image/*" onChange={handleChoose} />
          </>
        ) : (
          <div style={styles.previewBox}>
            <img src={previewURL} alt="Preview" style={styles.image} />
            <div style={styles.buttonRow}>
              <button onClick={handleRemove} style={styles.buttonGray}>Remove</button>
              <button onClick={handleUpload} style={styles.buttonGreen}>Start Enhance</button>
            </div>
          </div>
        )}
      </div>

      <div style={styles.column}>
        {enhancedURL ? (
          <div style={styles.previewBox}>
            <img src={enhancedURL} alt="Enhanced" style={styles.image} />
            <p style={{ marginTop: '0.5rem' }}>Enhanced Result</p>
          </div>
        ) : (
          <p style={{ opacity: 0.5 }}>Hasil akan muncul di sini</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
    padding: '2rem',
    border: '2px solid #ccc',
    borderRadius: '10px',
    background: '#f9f9f9',
    maxWidth: '1000px',
    margin: '0 auto',
    flexWrap: 'wrap',
  },
  column: {
    flex: 1,
    minWidth: '300px',
    textAlign: 'center',
  },
  previewBox: {
    padding: '1rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#fff',
  },
  image: {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '6px',
  },
  buttonRow: {
    marginTop: '10px',
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
  },
  buttonGreen: {
    backgroundColor: 'green',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  buttonGray: {
    backgroundColor: '#555',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
};

export default UploadForm;
