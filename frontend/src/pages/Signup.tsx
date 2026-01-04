
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const Signup: React.FC = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [submitted, setSubmitted] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		try {
			await createUserWithEmailAndPassword(auth, email, password);
			setSubmitted(true);
		} catch (err: any) {
			setError(err.message || 'Sign up failed');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={{ maxWidth: 400, margin: '3rem auto', textAlign: 'center' }}>
			<h2>Sign Up</h2>
			{submitted ? (
				<p>Thank you for signing up, {email}!</p>
			) : (
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
			)}
		</div>
	);
};

export default Signup;
