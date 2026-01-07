import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

const SignIn: React.FC = () => {
  const [searchParams] = useSearchParams();
  // Load saved email and password from localStorage if "Remember Me" was checked
  const [email, setEmail] = useState(() => {
    const savedEmail = localStorage.getItem('savedEmail');
    return savedEmail || '';
  });
  const [password, setPassword] = useState(() => {
    const savedPassword = localStorage.getItem('savedPassword');
    return savedPassword || '';
  });
  const [rememberMe, setRememberMe] = useState(() => {
    return !!localStorage.getItem('savedPassword');
  });
  // setRememberMe is used in the checkbox onChange handler
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if redirected from dashboard due to unverified email
    if (searchParams.get('verify') === 'required') {
      setError('Please verify your email address before accessing the dashboard. Check your inbox for the verification link.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if email is verified
      if (!user.emailVerified) {
        setError('Please verify your email address. Check your inbox for the verification link.');
        setLoading(false);
        return;
      }

      // Handle "Remember Me" functionality
      if (rememberMe) {
        localStorage.setItem('savedEmail', email);
        localStorage.setItem('savedPassword', password);
      } else {
        localStorage.removeItem('savedEmail');
        localStorage.removeItem('savedPassword');
      }
      
      // Set session storage for this browser session
      sessionStorage.setItem('userSession', 'active');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Sign in error:', err);
      
      // User-friendly error messages
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else if (err.message && err.message.includes('getRecaptchaConfig')) {
        setError('Authentication service is temporarily unavailable. Please try again in a few moments.');
      } else {
        setError(err.message || 'Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      sessionStorage.setItem('userSession', 'active');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please try again.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GithubAuthProvider();
      await signInWithPopup(auth, provider);
      sessionStorage.setItem('userSession', 'active');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('GitHub sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please try again.');
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with this email using a different sign-in method.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError('GitHub sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '3rem auto', textAlign: 'center' }}>
      <h2>Sign In</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={e => setRememberMe(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <label htmlFor="rememberMe" style={{ cursor: 'pointer', fontSize: '0.9rem', color: '#666' }}>
            Remember me (save username & password)
          </label>
        </div>
        {error && <div style={{ color: 'red', marginBottom: '1rem', padding: '0.75rem', background: '#ffebee', borderRadius: '4px' }}>{error}</div>}
        <button type="submit" style={{ padding: '0.5rem 2rem', width: '100%' }} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <div style={{ marginTop: '2rem' }}>
        <p>Or sign in with:</p>
        <button 
          onClick={handleGoogleSignIn} 
          disabled={loading}
          style={{ 
            margin: '0 0.5rem', 
            padding: '0.5rem 1rem',
            backgroundColor: '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          🔴 Google
        </button>
        <button 
          onClick={handleGitHubSignIn}
          disabled={loading}
          style={{ 
            margin: '0 0.5rem', 
            padding: '0.5rem 1rem',
            backgroundColor: '#24292e',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          ⚫ GitHub
        </button>
      </div>
    </div>
  );
};

export default SignIn;
