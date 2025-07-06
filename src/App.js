// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import BuyCoinsPage from './pages/BuyCoinsPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [user, setUser] = useState(null);         // Firebase Auth user
  const [userData, setUserData] = useState(null); // Firestore user profile (dengan koin, dll)

  const handleLogout = async () => {
    await auth.signOut();
    setUser(null);
    setUserData(null);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUserData(snap.data());
        }
      }
    };
    fetchUserData();
  }, [user]);

  return (
    <Router>
      <Header userData={userData} onLogout={handleLogout} />

      <div style={{ padding: '2rem', paddingTop: '80px' }}>
        <Routes>
          <Route path="/login" element={<LoginPage onAuth={setUser} />} />
          <Route path="/signup" element={<SignupPage onAuth={setUser} />} />
          <Route path="/buy-coins" element={<BuyCoinsPage user={user} userData={userData} />} />
          <Route
            path="/"
            element={
              <ProtectedRoute user={user}>
                <HomePage
                  user={user}
                  userData={userData}
                  setUserData={setUserData}
                />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
console.log("API KEY:", process.env.REACT_APP_API_KEY);
}

export default App;
