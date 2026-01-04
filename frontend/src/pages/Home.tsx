import React from 'react';
import { Link } from 'react-router-dom';
import OnboardingModal from '../components/OnboardingModal';


const Home: React.FC = () => (
  <div style={{ textAlign: 'center', marginTop: '3rem' }}>
    <OnboardingModal />
    <h1>Welcome to Webhook Monitor</h1>
    <p>Track, analyze, and manage your webhook events with ease.</p>
    <div style={{ marginTop: '2rem' }}>
      <Link to="/signup" style={{ marginRight: '1rem' }}>Sign Up</Link>
      <Link to="/login">Login</Link>
    </div>
  </div>
);

export default Home;
