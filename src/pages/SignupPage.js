import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import './AuthForm.css';

function SignupPage({ onAuth }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      // Buat akun dengan email dan password
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const user = res.user;

      // Simpan data user ke Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name,
        username,
        email,
        coins: 5 // <-- tambahkan koin awal
      });

      // Simpan mapping username -> email
      await setDoc(doc(db, 'usernames', username), {
        email,
      });

      onAuth(user);
      navigate('/');
    } catch (err) {
      alert('Signup gagal');
      console.error(err);
    }
  };

  const handleGoogleSignup = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Simpan data Google user ke Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: user.displayName,
        email: user.email,
        username: user.email.split('@')[0],
        coins: 5
      });

      await setDoc(doc(db, 'usernames', user.email.split('@')[0]), {
        email: user.email
      });

      onAuth(user);
      navigate('/');
    } catch (err) {
      alert('Signup dengan Google gagal');
      console.error(err);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSignup}>
        <label>Full Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />

        <label>Username</label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />

        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        <button type="submit">Signup</button>

        <hr />
        <button type="button" className="google-btn" onClick={handleGoogleSignup}>
          Signup with Google
        </button>
        <p style={{ marginTop: '10px' }}>
          Sudah punya akun? <Link to="/login">Login di sini</Link>
        </p>
      </form>
    </div>
  );
}

export default SignupPage;
