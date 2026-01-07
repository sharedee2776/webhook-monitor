


import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

import Home from './pages/Home';
import Signup from './pages/Signup';
import SignIn from './pages/SignIn';
import Dashboard from './pages/Dashboard';
import Checkout from './pages/Checkout';
import Success from './pages/Success';
import Cancel from './pages/Cancel';
import PlanDetails from './pages/PlanDetails';
import UserProfileMenu from './components/UserProfileMenu';
import './App.css';
import { useEffect, useState } from 'react';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { auth } from './firebase';
import type { User } from 'firebase/auth';
import DarkModeToggle from './components/DarkModeToggle';


function App() {
    useEffect(() => {
      const appInsights = new ApplicationInsights({
        config: {
          instrumentationKey: '33805546-a5b2-4a00-993c-d40296a94abe',
          enableAutoRouteTracking: true,
          disablePageUnloadEvents: ['unload']
        }
      });
      appInsights.loadAppInsights();
    }, []);
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <nav style={{ display: 'flex', gap: '1.5rem', padding: '1rem 2rem', background: '#222', color: '#fff', justifyContent: 'center', alignItems: 'center', position: 'relative', flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem' }}>Home</Link>
        {user && <Link to="/dashboard" style={{ color: '#fff' }}>Dashboard</Link>}
        {user && <Link to="/checkout" style={{ color: '#fff' }}>Pricing</Link>}
        {!user && (
          <>
            <Link to="/signup" style={{ color: '#fff', background: 'var(--primary)', padding: '0.5rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600 }}>Sign Up</Link>
            <Link to="/login" style={{ color: '#fff' }}>Sign In</Link>
          </>
        )}
        {user && user.email && (
          <div style={{ position: 'absolute', right: 24, top: 8 }}>
            <UserProfileMenu userEmail={user.email} />
          </div>
        )}
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/success" element={<Success />} />
        <Route path="/cancel" element={<Cancel />} />
        <Route path="/plan-details" element={<PlanDetails />} />
      </Routes>
      <DarkModeToggle />

      <footer style={{ marginTop: 40, padding: '1.5rem 0', background: '#f8fafc', color: '#222', textAlign: 'center', fontSize: '1.08rem', borderTop: '1px solid #e0e7ef' }}>
        Built by <strong>ADEDAMOLA DAUDA</strong> &middot; &copy; {new Date().getFullYear()} Webhook Monitor
      </footer>
    </BrowserRouter>
  );
}

export default App;
