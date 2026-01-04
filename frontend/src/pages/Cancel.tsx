import React from 'react';
import { Link } from 'react-router-dom';

const Cancel: React.FC = () => {
  return (
    <div style={{ maxWidth: 500, margin: '3rem auto', padding: '2rem', textAlign: 'center' }}>
      <h2>Payment Cancelled</h2>
      <p>Your payment was cancelled. You can try again or contact support if you need help.</p>
      <Link to="/checkout" style={{ color: '#646cff', textDecoration: 'underline' }}>Return to Checkout</Link>
    </div>
  );
};

export default Cancel;
