import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './EnhancerBox.css';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

function EnhancerBox({ user, userData, onCoinUpdate }) {

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [enhanced, setEnhanced] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleChoose = (e) => {
    const file = e.target.files[0];

    if(file){
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setEnhanced(null);
    }
  };

  const handleEnhance = async () => {

    if(!user){
      navigate('/login');
      return;
    }

    if(userData?.coins <= 0){
      alert('Koin kamu habis.');
      return;
    }

    if(!selectedFile) return;

    setIsLoading(true);

    try{

      const HF_URL = "https://ricoputra1708-image-enhancer.hf.space";

      // Step 1: Upload file ke HF Space
      const formData = new FormData();
      formData.append("files", selectedFile);

      const uploadRes = await fetch(`${HF_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if(!uploadRes.ok) throw new Error("Upload gagal");

      const uploadData = await uploadRes.json();
      const filePath = uploadData[0]; // path file di server HF

      // Step 2: Panggil endpoint predict
      const predictRes = await fetch(`${HF_URL}/run/enhance_image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [{ path: filePath }],
        }),
      });

      if(!predictRes.ok) throw new Error("Predict gagal");

      const predictData = await predictRes.json();
      const outputUrl = predictData.data[0].url;

      setEnhanced(outputUrl);

      // Kurangi koin
      const newCoins = userData.coins - 1;
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { coins: newCoins });
      onCoinUpdate(newCoins);

    }
    catch(err){

      console.error(err);
      alert("Enhance failed: " + err.message);

    }
    finally{

      setIsLoading(false);

    }
  };

  const handleRemove = () => {

    setSelectedFile(null);
    setPreview(null);
    setEnhanced(null);

  };

  return (
    <div className="enhancer-box">

      <h3 className="title">
        Enhance Image Quality
      </h3>

      {!preview ? (

        <div className="center-upload-area">

          <input
            type="file"
            accept="image/*"
            onChange={handleChoose}
            id="upload-input"
            style={{display:'none'}}
          />

          <button
            className="upload-button"
            onClick={()=>
              document
                .getElementById('upload-input')
                .click()
            }
          >
            Upload Image
          </button>

        </div>

      ) : (

        <div className="enhancer-content show-divider">

          <div className="input-section">

            <img
              src={preview}
              alt="Preview"
              className="preview-img"
            />

            <div className="action-buttons">

              <button onClick={handleRemove}>
                Remove
              </button>

              <button
                onClick={handleEnhance}
                disabled={isLoading}
              >

                {isLoading ? (

                  "Enhancing..."

                ) : (

                  <>
                    Enhance 1{' '}
                    <img
                      src="/assets/coin.png"
                      alt="coin"
                      style={{
                        width:'16px',
                        height:'16px',
                        verticalAlign:'middle',
                        marginLeft:'4px'
                      }}
                    />
                  </>

                )}

              </button>

            </div>

          </div>

          <div className="divider"></div>

          <div className="output-section">

            {isLoading && (

              <div className="loading-box">

                <div className="spinner"></div>

                <p>
                  Enhancing image...
                </p>

              </div>

            )}

            {!isLoading && enhanced && (

              <>
                <img
                  src={enhanced}
                  alt="Enhanced"
                  className="enhanced-img"
                />

                <a href={enhanced} download>

                  <button className="download-button">
                    Download
                  </button>

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
