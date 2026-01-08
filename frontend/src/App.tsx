


import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

import Home from './pages/Home';
import Signup from './pages/Signup';
import SignIn from './pages/SignIn';
import Dashboard from './pages/Dashboard';
import Checkout from './pages/Checkout';
import Success from './pages/Success';
import Cancel from './pages/Cancel';
import PlanDetails from './pages/PlanDetails';
import Docs from './pages/Docs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import UserProfileMenu from './components/UserProfileMenu';
import './App.css';
import { useEffect, useState } from 'react';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import DarkModeToggle from './components/DarkModeToggle';
import { useInactivityLogout } from './utils/useInactivityLogout';


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
  
  // Clear session data on browser/tab close for security
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear sessionStorage when browser/tab is closed
      sessionStorage.removeItem('userSession');
      // Note: Firebase SESSION persistence will automatically clear auth state on browser close
    };

    const handleVisibilityChange = () => {
      // If page becomes hidden (user switching tabs or closing), prepare for cleanup
      if (document.hidden) {
        // This is a fallback - SESSION persistence handles the main cleanup
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Check session on mount - if no sessionStorage, require login
  useEffect(() => {
    const sessionActive = sessionStorage.getItem('userSession');
    if (!sessionActive && auth.currentUser) {
      // Browser was closed/reopened, sign out
      signOut(auth).catch(console.error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        // Set session when user signs in
        sessionStorage.setItem('userSession', 'active');
        setUser(firebaseUser);
      } else {
        // Clear session when user signs out
        sessionStorage.removeItem('userSession');
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Auto-logout after inactivity
  useInactivityLogout(!!user);

  return (
    <BrowserRouter>
      <nav style={{ display: 'flex', gap: '1.5rem', padding: '1rem 2rem', background: '#222', color: '#fff', justifyContent: 'center', alignItems: 'center', position: 'relative', flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem' }}>Home</Link>
        {user && <Link to="/dashboard" style={{ color: '#fff' }}>Dashboard</Link>}
        {user && <Link to="/checkout" style={{ color: '#fff' }}>Pricing</Link>}
        <Link to="/docs" style={{ color: '#fff', textDecoration: 'none' }}>
          Docs
        </Link>
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
        <Route path="/docs" element={<Docs />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
      </Routes>
      <DarkModeToggle />

      <footer style={{ marginTop: 40, padding: '2rem 1rem', background: '#f8fafc', color: '#222', textAlign: 'center', fontSize: '1.08rem', borderTop: '1px solid #e0e7ef' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.95rem' }}>
              <Link to="/docs" style={{ color: '#666', textDecoration: 'none' }}>Documentation</Link>
              <Link to="/privacy" style={{ color: '#666', textDecoration: 'none' }}>Privacy Policy</Link>
              <Link to="/terms" style={{ color: '#666', textDecoration: 'none' }}>Terms of Service</Link>
              <a href="mailto:damoladauda10@gmail.com" style={{ color: '#666', textDecoration: 'none' }}>Contact</a>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span>Built by <strong>Adedamola</strong> &middot; &copy; {new Date().getFullYear()} Webhook Monitor</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
            <a
              href="https://github.com/sharedee2776"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                color: '#666',
                textDecoration: 'none',
                transition: 'color 0.2s',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#222';
                e.currentTarget.setAttribute('title', 'View GitHub profile');
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#666';
              }}
              title="View GitHub profile"
              aria-label="GitHub profile"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <a
              href="https://linkedin.com/in/adedamola-dauda"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                color: '#666',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#0077b5';
                e.currentTarget.setAttribute('title', 'Connect on LinkedIn');
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#666';
              }}
              title="Connect on LinkedIn"
              aria-label="LinkedIn profile"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          </div>
        </div>
        </div>
      </footer>
    </BrowserRouter>
  );
}

export default App;
