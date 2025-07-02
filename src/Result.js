import React from 'react';

function Result({ image }) {
  return (
    <div style={{ marginTop: '2rem' }}>
      <h2>Enhanced Image</h2>
      <img src={image} alt="Enhanced" style={{ maxWidth: '100%' }} />
    </div>
  );
}

export default Result;
