// src/pages/HomePage.js
import React from 'react';
import axios from 'axios';
import EnhancerBox from '../components/EnhancerBox';

function HomePage({ user, userData, setUserData }) {
  const handleTopup = async () => {
    try {
      const res = await axios.post('http://localhost:5001/create-transaction', {
        userId: user?.uid,
        name: userData?.name,
        email: user?.email
      });

      const snapToken = res.data.token;

      window.snap.pay(snapToken, {
        onSuccess: function(result) {
          alert("Pembayaran berhasil!");
          console.log(result);
          // TODO: Tambahkan logika update koin
        },
        onPending: function(result) {
          alert("Pembayaran menunggu...");
          console.log(result);
        },
        onError: function(result) {
          alert("Pembayaran gagal");
          console.log(result);
        },
        onClose: function() {
          alert("Kamu menutup popup tanpa menyelesaikan pembayaran");
        }
      });

    } catch (err) {
      alert('Gagal membuat transaksi Midtrans');
      console.error(err);
    }
  };

  return (
    <div style={{ paddingTop: '50px', textAlign: 'center' }}>
      <EnhancerBox
        user={user}
        userData={userData}
        onCoinUpdate={(newCoins) => {
          setUserData(prev => ({ ...prev, coins: newCoins }));
        }}
      />

      <div style={{ marginTop: '30px' }}>
        <h3>Beli Koin</h3>
        <button
          onClick={handleTopup}
          style={{
            padding: '12px 24px',
            backgroundColor: '#00aaff',
            color: 'white',
            fontWeight: 'bold',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Beli 100 Koin (Rp15.000)
        </button>
      </div>
    </div>
  );
}

export default HomePage;
