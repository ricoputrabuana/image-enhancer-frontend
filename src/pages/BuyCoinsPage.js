import React from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './BuyCoinsPage.css';

const coinPackages = [
  { coins: 5, price: 3 },
  { coins: 10, price: 5 },
  { coins: 50, price: 22 },
  { coins: 100, price: 40 }
];

function BuyCoinsPage({ user, userData }) {
  const navigate = useNavigate();

  const handleTopup = async (packageInfo) => {
    try {
      const res = await axios.post('http://localhost:5001/create-transaction', {
        userId: user?.uid,
        name: userData?.name,
        email: user?.email,
        coins: packageInfo.coins,
        amount: packageInfo.price * 16239 // Convert to IDR if pakai Rupiah
      });

      window.snap.pay(res.data.token, {
        onSuccess: () => {
          alert('Pembayaran berhasil!');
          navigate('/');
        },
        onClose: () => alert('Kamu menutup popup.')
      });

    } catch (err) {
      alert('Gagal membuat transaksi');
      console.error(err);
    }
  };

  return (
    <div className="buy-coins-container">
      <h2>Buy Coins</h2>
      <div className="coin-package-list">
        {coinPackages.map((pkg) => (
          <div className="coin-card" key={pkg.coins}>
            <h3>{pkg.coins} Koin</h3>
            <p>US${pkg.price}</p>
            <button onClick={() => handleTopup(pkg)}>Beli</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BuyCoinsPage;