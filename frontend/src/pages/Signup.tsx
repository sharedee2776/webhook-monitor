
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

const Signup: React.FC = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [submitted, setSubmitted] = useState(false);
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		try {
			await createUserWithEmailAndPassword(auth, email, password);
			setSubmitted(true);
			// Redirect to dashboard after successful signup
			setTimeout(() => navigate('/dashboard'), 2000);
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
				<div>
					<p style={{ color: 'green' }}>Thank you for signing up, {email}!</p>
					<p>Redirecting to dashboard...</p>
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
					{error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
					<button type="submit" style={{ padding: '0.5rem 2rem' }} disabled={loading}>
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
