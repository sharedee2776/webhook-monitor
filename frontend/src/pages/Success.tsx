import React from 'react';
import { Link } from 'react-router-dom';

const Success: React.FC = () => {
  // Optionally parse query params for session info
  return (
    <div style={{ maxWidth: 500, margin: '3rem auto', padding: '2rem', textAlign: 'center' }}>
      <h2>🎉 Payment Successful!</h2>
      <p>Your subscription is now active. Thank you for your purchase.</p>
      <Link to="/dashboard" style={{ color: '#646cff', textDecoration: 'underline' }}>Go to Dashboard</Link>
    </div>
  );
};

export default Success;
