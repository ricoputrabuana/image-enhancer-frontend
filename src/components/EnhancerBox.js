import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './EnhancerBox.css';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Client } from "@gradio/client";

function EnhancerBox({ user, userData, onCoinUpdate }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [enhanced, setEnhanced] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
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

  setIsLoading(true);

  const formData = new FormData();
  formData.append('files', selectedFile);

  try {

    const client =
      await Client.connect(
        "ricoputra1708/image-enhancer"
      );

    const result =
      await client.predict(
        "/enhance_image",
        {
          img: selectedFile
        }
      );

    console.log(result);

    const outputImage =
      result.data[0];

    setEnhanced(outputImage.url);

    const newCoins =
      userData.coins - 1;

    const userRef =
      doc(db,'users',user.uid);

    await updateDoc(
      userRef,
      { coins:newCoins }
    );

    onCoinUpdate(newCoins);

  }
  catch(err){

    console.error(err);

    alert("Enhance failed");
  }
  finally {

  setIsLoading(false);
  }
};


  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(null);
    setd(null);
  };

  return (
    <div className="r-box">
      <h3 className="title"> Image Quality</h3>

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
        <div className="r-content show-divider">
          <div className="input-section">
            <img src={preview} alt="Preview" className="preview-img" />
            <div className="action-buttons">
              <button onClick={handleRemove}>Remove</button>
              <button 
                onClick={handle}
                disabled={isLoading}
              >
                {isLoading ? (
                  'Enhancing...'
                ) : (
                  <>
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
