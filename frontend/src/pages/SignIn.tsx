import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { Envelope, Lock, ArrowRight, SignIn as SignInIcon } from '@phosphor-icons/react';

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        padding: '3rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: 80, 
            height: 80, 
            background: 'rgba(255,255,255,0.2)', 
            borderRadius: '50%', 
            marginBottom: '1.5rem' 
          }}>
            <SignInIcon size={40} color="#fff" weight="bold" />
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.2 }}>
            Welcome Back
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.95, lineHeight: 1.6 }}>
            Sign in to access your webhook monitoring dashboard
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section style={{ 
        flex: 1, 
        padding: '3rem 2rem', 
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="card" style={{ 
          maxWidth: 450, 
          width: '100%',
          padding: '2.5rem',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)'
        }}>
          <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.9rem', 
                fontWeight: 600, 
                color: '#374151' 
              }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Envelope 
                  size={20} 
                  style={{ 
                    position: 'absolute', 
                    left: '1rem', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#9ca3af' 
                  }} 
                />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem 1rem 0.75rem 3rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontSize: '0.9rem', 
                fontWeight: 600, 
                color: '#374151' 
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock 
                  size={20} 
                  style={{ 
                    position: 'absolute', 
                    left: '1rem', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#9ca3af' 
                  }} 
                />
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem 1rem 0.75rem 3rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>
            <div style={{ 
              marginBottom: '1.25rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                cursor: 'pointer',
                fontSize: '0.9rem', 
                color: '#6b7280' 
              }}>
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                />
                Remember me
              </label>
            </div>
            {error && (
              <div style={{ 
                color: '#dc2626', 
                marginBottom: '1.25rem', 
                padding: '0.75rem 1rem', 
                background: '#fef2f2', 
                borderRadius: '8px',
                border: '1px solid #fecaca',
                fontSize: '0.9rem'
              }}>
                {error}
              </div>
            )}
            <button 
              type="submit" 
              className="btn"
              style={{ 
                width: '100%',
                padding: '0.875rem 2rem', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
              }}
              disabled={loading}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
              }}
            >
              {loading ? (
                <>
                  <div style={{ 
                    width: '16px', 
                    height: '16px', 
                    border: '2px solid rgba(255,255,255,0.3)', 
                    borderTopColor: '#fff', 
                    borderRadius: '50%', 
                    animation: 'spin 0.8s linear infinite' 
                  }}></div>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            margin: '1.5rem 0',
            color: '#9ca3af'
          }}>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
            <span style={{ fontSize: '0.875rem' }}>Or continue with</span>
            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <button 
              onClick={handleGoogleSignIn} 
              disabled={loading}
              style={{ 
                padding: '0.75rem 1rem',
                background: '#fff',
                color: '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                opacity: loading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>G</span>
              Google
            </button>
            <button 
              onClick={handleGitHubSignIn}
              disabled={loading}
              style={{ 
                padding: '0.75rem 1rem',
                background: '#24292e',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                opacity: loading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#1a1e22';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(36, 41, 46, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#24292e';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: '18px' }}>⚫</span>
              GitHub
            </button>
          </div>

          <div style={{ 
            textAlign: 'center', 
            paddingTop: '1.5rem', 
            borderTop: '1px solid #e5e7eb',
            fontSize: '0.9rem',
            color: '#6b7280'
          }}>
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              style={{ 
                color: 'var(--primary)', 
                textDecoration: 'none', 
                fontWeight: 600 
              }}
            >
              Sign up for free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SignIn;
