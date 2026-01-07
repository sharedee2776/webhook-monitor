
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

const Signup: React.FC = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [rememberMe, setRememberMe] = useState(false);
	const [error, setError] = useState('');
	const [submitted, setSubmitted] = useState(false);
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		try {
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			const user = userCredential.user;
			
			// Send email verification
			await sendEmailVerification(user);
			
			// Handle "Remember Me" functionality
			if (rememberMe) {
				localStorage.setItem('savedEmail', email);
				localStorage.setItem('savedPassword', password);
			} else {
				localStorage.removeItem('savedEmail');
				localStorage.removeItem('savedPassword');
			}
			
			setSubmitted(true);
			// Show verification message instead of redirecting immediately
		} catch (err: any) {
			console.error('Sign up error:', err);
			if (err.code === 'auth/email-already-in-use') {
				setError('An account with this email already exists. Please sign in instead.');
			} else if (err.code === 'auth/weak-password') {
				setError('Password should be at least 6 characters.');
			} else if (err.code === 'auth/invalid-email') {
				setError('Invalid email address.');
			} else {
				setError(err.message || 'Sign up failed. Please try again.');
			}
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleSignUp = async () => {
		setLoading(true);
		setError('');
		try {
			const provider = new GoogleAuthProvider();
			await signInWithPopup(auth, provider);
			sessionStorage.setItem('userSession', 'active');
			setSubmitted(true);
			setTimeout(() => navigate('/dashboard'), 1000);
		} catch (err: any) {
			console.error('Google sign-up error:', err);
			if (err.code === 'auth/popup-closed-by-user') {
				setError('Sign-up cancelled. Please try again.');
			} else if (err.code === 'auth/account-exists-with-different-credential') {
				setError('An account already exists with this email using a different sign-in method.');
			} else {
				setError('Google sign-up failed. Please try again.');
			}
		} finally {
			setLoading(false);
		}
	};

	const handleGitHubSignUp = async () => {
		setLoading(true);
		setError('');
		try {
			const provider = new GithubAuthProvider();
			await signInWithPopup(auth, provider);
			sessionStorage.setItem('userSession', 'active');
			setSubmitted(true);
			setTimeout(() => navigate('/dashboard'), 1000);
		} catch (err: any) {
			console.error('GitHub sign-up error:', err);
			if (err.code === 'auth/popup-closed-by-user') {
				setError('Sign-up cancelled. Please try again.');
			} else if (err.code === 'auth/account-exists-with-different-credential') {
				setError('An account already exists with this email using a different sign-in method.');
			} else {
				setError('GitHub sign-up failed. Please try again.');
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={{ maxWidth: 400, margin: '3rem auto', textAlign: 'center' }}>
			<h2>Sign Up</h2>
			{submitted ? (
				<div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
					<div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
					<h3 style={{ color: '#222', marginBottom: '1rem' }}>Verify Your Email</h3>
					<p style={{ color: '#666', marginBottom: '1rem', lineHeight: 1.6 }}>
						We've sent a verification link to <strong>{email}</strong>
					</p>
					<p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
						Please check your inbox and click the verification link to activate your account. 
						If you don't see the email, check your spam folder.
					</p>
					<div style={{ 
						background: '#f0f7ff', 
						padding: '1rem', 
						borderRadius: '8px', 
						marginBottom: '1.5rem',
						border: '1px solid #b3d9ff'
					}}>
						<p style={{ margin: 0, fontSize: '0.9rem', color: '#0066cc' }}>
							<strong>Note:</strong> You can sign in after verifying your email. 
							The verification link will expire in 24 hours.
						</p>
					</div>
					<button
						onClick={() => navigate('/login')}
						style={{
							padding: '0.75rem 2rem',
							background: 'var(--primary)',
							color: '#fff',
							border: 'none',
							borderRadius: '8px',
							fontSize: '1rem',
							fontWeight: 600,
							cursor: 'pointer'
						}}
					>
						Go to Sign In
					</button>
				</div>
			) : (
				<>
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
							id="rememberMeSignup"
							checked={rememberMe}
							onChange={e => setRememberMe(e.target.checked)}
							style={{ cursor: 'pointer' }}
						/>
						<label htmlFor="rememberMeSignup" style={{ cursor: 'pointer', fontSize: '0.9rem', color: '#666' }}>
							Remember me (save username & password)
						</label>
					</div>
					{error && <div style={{ color: 'red', marginBottom: '1rem', padding: '0.75rem', background: '#ffebee', borderRadius: '4px' }}>{error}</div>}
					<button type="submit" style={{ padding: '0.5rem 2rem', width: '100%' }} disabled={loading}>
						{loading ? 'Signing up...' : 'Sign Up'}
					</button>
				</form>
				<div style={{ marginTop: '2rem' }}>
					<p>Or sign up with:</p>
					<button 
						onClick={handleGoogleSignUp}
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
						onClick={handleGitHubSignUp}
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
			</>
			)}
		</div>
	);
};

export default Signup;
