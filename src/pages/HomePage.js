// src/pages/HomePage.js
import React from 'react';
import axios from 'axios';
import EnhancerBox from '../components/EnhancerBox';

function HomePage({ user, userData, setUserData }) {

   return (
    <div style={{ paddingTop:'50px', textAlign:'center' }}>

      <EnhancerBox
        user={user}
        userData={userData}
        onCoinUpdate={(newCoins)=>{
          setUserData(prev=>({
            ...prev,
            coins:newCoins
          }));
        }}
      />

    </div>
  );
}
export default HomePage;
