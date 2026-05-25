import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './EnhancerBox.css';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

function EnhancerBox({ user, userData, onCoinUpdate }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [enhanced, setEnhanced] = useState(null);
  const navigate = useNavigate();

  const handleChoose = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

const handleEnhance = async () => {
  if (!user) {
    navigate('/login');
    return;
  }

  if (userData?.coins <= 0) {
    alert('Koin kamu habis.');
    return;
  }

  if (!selectedFile) return;

  const formData = new FormData();
  formData.append('files', selectedFile);

  try {

    // 1. upload file ke gradio
    const uploadRes = await axios.post(
      'https://ricoputra1708-image-enhancer.hf.space/gradio_api/upload',
      formData
    );

    const uploadedPath = uploadRes.data[0];

    // 2. panggil inference api
    const predictRes = await axios.post(
      'https://ricoputra1708-image-enhancer.hf.space/gradio_api/call/enhance_image',
      {
        data: [uploadedPath]
      }
    );

    console.log(predictRes.data);

    const eventId = predictRes.data.event_id;

    // 3. ambil hasil
    const resultRes = await axios.get(
      `https://ricoputra1708-image-enhancer.hf.space/gradio_api/call/enhance_image/${eventId}`
    );

    console.log(resultRes.data);

    const resultImage = resultRes.data.output.data[0];

    setEnhanced(resultImage);

    // kurangi coin
    const newCoins = userData.coins - 1;
    const userRef = doc(db, 'users', user.uid);

    await updateDoc(userRef, {
      coins: newCoins
    });

    onCoinUpdate(newCoins);

  } catch (err) {

    console.error(err);

    alert('Enhance failed');
  }
};


  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(null);
    setEnhanced(null);
  };

  return (
    <div className="enhancer-box">
      <h3 className="title">Enhance Image Quality</h3>

      {!preview ? (
        <div className="center-upload-area">
          <input
            type="file"
            accept="image/*"
            onChange={handleChoose}
            id="upload-input"
            style={{ display: 'none' }}
          />
          <button
            className="upload-button"
            onClick={() => document.getElementById('upload-input').click()}
          >
            Upload Image
          </button>
        </div>
      ) : (
        <div className="enhancer-content show-divider">
          <div className="input-section">
            <img src={preview} alt="Preview" className="preview-img" />
            <div className="action-buttons">
              <button onClick={handleRemove}>Remove</button>
              <button onClick={handleEnhance}>
                Enhance 1{' '}
                <img
                  src="/assets/coin.png"
                  alt="coin"
                  style={{
                    width: '16px',
                    height: '16px',
                    verticalAlign: 'middle',
                    marginLeft: '4px'
                  }}
                />
              </button>
            </div>
          </div>
          <div className="divider"></div>
          <div className="output-section">
            {enhanced && (
              <>
                <img src={enhanced} alt="Enhanced" className="enhanced-img" />
                <a href={enhanced} download>
                  <button className="download-button">Download</button>
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancerBox;
