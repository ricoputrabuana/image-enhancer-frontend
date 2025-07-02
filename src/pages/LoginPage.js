// src/pages/LoginPage.js
import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import './AuthForm.css';

function LoginPage({ onAuth }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      let emailToLogin = identifier;

      // Jika input bukan email, asumsikan itu username
      if (!identifier.includes('@')) {
        const snapshot = await getDoc(doc(db, 'users', identifier));
        if (!snapshot.exists()) {
          throw new Error('Username tidak ditemukan');
        }
        const userData = snapshot.data();
        emailToLogin = userData.email;
      }

      const userCredential = await signInWithEmailAndPassword(auth, emailToLogin, password);
      onAuth(userCredential.user);
      navigate('/');
    } catch (error) {
      alert('Login gagal: ' + error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      onAuth(result.user);
      navigate('/');
    } catch (error) {
      alert('Login Google gagal: ' + error.message);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
        <h2 style={{ textAlign: 'center' }}>Login</h2>

        <label>Username / Email</label>
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Enter username or email"
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />

        <button type="submit">Login</button>
        <button type="button" onClick={handleGoogleLogin} className="google-btn">
          Login with Google
        </button>

        <p style={{ textAlign: 'center', marginTop: '10px' }}>
          Belum punya akun? <Link to="/signup">Daftar di sini</Link>
        </p>
      </form>
    </div>
  );

}

export default LoginPage;
