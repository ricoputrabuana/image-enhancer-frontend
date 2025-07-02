// src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

function Header({ userData, onLogout }) {
  return (
    <header className="header">
      <div className="left-group">
        <div className="logo">🔔 Bell</div>
        <nav className="nav-links">
          <a href="#pricing">Pricing</a>
        </nav>
      </div>
      <div className="auth-links">
        {!userData ? (
          <Link to="/login" className="auth-button">Sign Up/Login</Link>
        ) : (
          <>
            <span>
              {userData.name}{' '}
              ({userData.coins}{''}
              <img
                src="/assets/coin.png"
                alt="coin"
                style={{ width: '16px', height: '16px', verticalAlign: 'middle' }}
              />
              )
            </span>
            <Link to="/buy-coins" className="auth-button">Buy Coins</Link>
            <button onClick={onLogout} className="auth-button">Logout</button>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;