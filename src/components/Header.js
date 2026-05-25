// src/components/Header.js

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

function Header({ userData, onLogout }) {

  const [menuOpen,setMenuOpen] = useState(false);

  return (
    <header className="header">

      <div className="left-group">

        <div className="logo">
          🔔 Bell
        </div>

        <nav className="nav-links">
          <a href="#pricing">Pricing</a>
        </nav>

      </div>

      <div className="auth-links">

        {!userData ? (

          <Link
            to="/login"
            className="auth-button"
          >
            Sign Up / Login
          </Link>

        ) : (

          <>

            {/* Coins */}

            <Link
              to="/buy-coins"
              className="coin-box"
            >

              <span className="coin-count">

                {userData.coins}

                <img
                  src="/assets/coin.png"
                  alt="coin"
                  className="coin-icon"
                />

              </span>

              <span className="plus-icon">
                +
              </span>

            </Link>

            {/* Profile */}

            <div className="profile-wrapper">

              <button
                className="profile-btn"
                onClick={()=>
                  setMenuOpen(!menuOpen)
                }
              >
                <img
                  src="/assets/account.png"
                  alt="profile"
                  className="profile-icon"
                />
                <span className="dropdown-arrow">
                  ▼
                </span>
              </button>

              {menuOpen && (

                <div className="profile-dropdown">

                  <div className="profile-name">
                    {userData.name}
                  </div>

                  <div className="profile-email">
                    {userData.email}
                  </div>

                  <hr />

                  <div className="dropdown-item no-hover">
                  
                    <span>Coins: {userData.coins}</span>
                  
                    <img
                      src="/assets/coin.png"
                      alt="coin"
                      className="dropdown-coin-icon"
                    />
                  
                    <Link
                      to="/buy-coins"
                      className="dropdown-plus"
                    >
                      +
                    </Link>
                  
                  </div>
                  
                  <div className="dropdown-item history-link">
                    History Images
                  </div>

                </div>

              )}

            </div>

            {/* Logout */}

            <button
              onClick={onLogout}
              className="logout-btn"
            >
              <img
                src="/assets/logout.png"
                alt="logout"
                className="logout-icon"
              />
            </button>

          </>

        )}

      </div>

    </header>
  );
}

export default Header;
