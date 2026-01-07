import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { Envelope, Lock, ArrowRight, UserPlus, EnvelopeSimple, CheckCircle } from '@phosphor-icons/react';

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
						<UserPlus size={40} color="#fff" weight="bold" />
					</div>
					<h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.2 }}>
						Create Your Account
					</h1>
					<p style={{ fontSize: '1.1rem', opacity: 0.95, lineHeight: 1.6 }}>
						Start monitoring webhooks in minutes. No credit card required.
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
				<div style={{ maxWidth: 450, width: '100%' }}>
				{submitted ? (
					<div className="card" style={{ 
						padding: '2.5rem',
						textAlign: 'center',
						boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)'
					}}>
						<div style={{ 
							display: 'inline-flex', 
							alignItems: 'center', 
							justifyContent: 'center', 
							width: 80, 
							height: 80, 
							background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
							borderRadius: '50%', 
							marginBottom: '1.5rem' 
						}}>
							<EnvelopeSimple size={40} color="#fff" weight="bold" />
						</div>
						<h2 style={{ fontSize: '1.75rem', color: '#222', marginBottom: '1rem', fontWeight: 700 }}>
							Verify Your Email
						</h2>
						<p style={{ color: '#6b7280', marginBottom: '1rem', lineHeight: 1.6, fontSize: '1rem' }}>
							We've sent a verification link to <strong style={{ color: '#222' }}>{email}</strong>
						</p>
						<p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
							Please check your inbox and click the verification link to activate your account. 
							If you don't see the email, check your spam folder.
						</p>
						<div style={{ 
							background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)', 
							padding: '1rem 1.25rem', 
							borderRadius: '8px', 
							marginBottom: '1.5rem',
							border: '1px solid rgba(102, 126, 234, 0.2)'
						}}>
							<div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
								<CheckCircle size={20} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '0.1rem' }} weight="fill" />
								<p style={{ margin: 0, fontSize: '0.9rem', color: '#374151', textAlign: 'left' }}>
									<strong>Note:</strong> You can sign in after verifying your email. 
									The verification link will expire in 24 hours.
								</p>
							</div>
						</div>
						<Link
							to="/login"
							className="btn"
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: '0.5rem',
								padding: '0.875rem 2rem',
								background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
								color: '#fff',
								border: 'none',
								borderRadius: '8px',
								fontSize: '1rem',
								fontWeight: 600,
								textDecoration: 'none',
								boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
								transition: 'transform 0.2s, box-shadow 0.2s'
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.transform = 'translateY(-2px)';
								e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
							}}
						>
							Go to Sign In <ArrowRight size={18} />
						</Link>
					</div>
				) : (
					<div className="card" style={{ 
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
										placeholder="At least 6 characters"
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
										id="rememberMeSignup"
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
										Signing up...
									</>
								) : (
									<>
										Create Account <ArrowRight size={18} />
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
								onClick={handleGoogleSignUp}
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
								onClick={handleGitHubSignUp}
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
							Already have an account?{' '}
							<Link 
								to="/login" 
								style={{ 
									color: 'var(--primary)', 
									textDecoration: 'none', 
									fontWeight: 600 
								}}
							>
								Sign in
							</Link>
						</div>
					</div>
				)}
				</div>
			</section>
		</div>
	);
};

export default Signup;
