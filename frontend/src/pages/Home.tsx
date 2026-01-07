import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import OnboardingModal from '../components/OnboardingModal';
import { ChartBar, Shield, Lightning, Users, CheckCircle, ArrowRight, TrendUp, Database } from '@phosphor-icons/react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const Home: React.FC = () => {
  const [user, setUser] = React.useState<any>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const features = [
    {
      icon: <ChartBar size={32} />,
      title: 'Real-Time Analytics',
      description: 'Track and analyze webhook events with comprehensive dashboards and insights.'
    },
    {
      icon: <Shield size={32} />,
      title: 'Enterprise Security',
      description: 'API key management, request signing, audit logs, and IP tracking for maximum security.'
    },
    {
      icon: <Lightning size={32} />,
      title: 'Instant Alerts',
      description: 'Get notified via email, Discord, or webhooks when events fail or thresholds are exceeded.'
    },
    {
      icon: <Users size={32} />,
      title: 'Team Collaboration',
      description: 'Manage team members, share API keys, and collaborate on webhook monitoring.'
    }
  ];

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      features: ['1,000 events/month', '1 API key', 'Basic analytics', 'Email support'],
      cta: 'Get Started Free',
      highlight: false
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/month',
      features: ['100,000 events/month', '5 API keys', 'Advanced analytics', 'Priority support', 'Audit logs'],
      cta: 'Start Pro Trial',
      highlight: true
    },
    {
      name: 'Team',
      price: '$99',
      period: '/month',
      features: ['1,000,000 events/month', '20 API keys', 'Team collaboration', 'Dedicated support', 'Custom integrations'],
      cta: 'Contact Sales',
      highlight: false
    }
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      <OnboardingModal />
      
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        padding: '4rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1rem', lineHeight: 1.2 }}>
            Monitor Webhooks Like a Pro
          </h1>
          <p style={{ fontSize: '1.3rem', marginBottom: '2rem', opacity: 0.95, lineHeight: 1.6 }}>
            Track, analyze, and manage webhook events with enterprise-grade security and real-time analytics. 
            Trusted by developers worldwide.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {user ? (
              <Link
                to="/dashboard"
                className="btn"
                style={{
                  background: '#fff',
                  color: '#667eea',
                  fontSize: '1.1rem',
                  padding: '1rem 2.5rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                Go to Dashboard <ArrowRight size={20} />
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="btn"
                  style={{
                    background: '#fff',
                    color: '#667eea',
                    fontSize: '1.1rem',
                    padding: '1rem 2.5rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  Start Free Trial <ArrowRight size={20} />
                </Link>
                <Link
                  to="/login"
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontSize: '1.1rem',
                    padding: '1rem 2.5rem',
                    borderRadius: '0.5rem',
                    border: '2px solid rgba(255,255,255,0.3)',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
          <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
            ✓ No credit card required &middot; ✓ Free tier available &middot; ✓ Setup in 2 minutes
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '4rem 2rem', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem', color: '#222' }}>
            Everything You Need to Monitor Webhooks
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem'
          }}>
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="card"
                style={{
                  textAlign: 'center',
                  padding: '2rem',
                  transition: 'transform 0.2s'
                }}
              >
                <div style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: '#222' }}>
                  {feature.title}
                </h3>
                <p style={{ color: '#666', lineHeight: 1.6 }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section style={{ padding: '4rem 2rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '1rem', color: '#222' }}>
            Why Choose Webhook Monitor?
          </h2>
          <p style={{ textAlign: 'center', fontSize: '1.1rem', color: '#666', marginBottom: '3rem', maxWidth: 700, margin: '0 auto 3rem' }}>
            While tools like webhook.site, Hooklistener, and WebhookDebugger are great for quick testing, 
            Webhook Monitor is built for production teams who need reliability, history, and collaboration.
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                  borderRadius: '12px', 
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Database size={28} color="#fff" />
                </div>
                <h3 style={{ fontSize: '1.3rem', color: '#222', margin: 0 }}>Extended Event History</h3>
              </div>
              <p style={{ color: '#666', lineHeight: 1.7, marginBottom: '1rem' }}>
                Unlike free tools that delete events after 7 days, we retain your webhook history for up to 90 days 
                (depending on your plan), giving you time to debug issues and analyze patterns.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '0.95rem' }}>
                <CheckCircle size={18} weight="fill" />
                <span>90-day retention on Pro plans</span>
              </div>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, #2d6cdf 0%, #1a417a 100%)', 
                  borderRadius: '12px', 
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Users size={28} color="#fff" />
                </div>
                <h3 style={{ fontSize: '1.3rem', color: '#222', margin: 0 }}>Team Collaboration</h3>
              </div>
              <p style={{ color: '#666', lineHeight: 1.7, marginBottom: '1rem' }}>
                Built for teams from day one. Share API keys securely, manage roles, and collaborate on webhook monitoring. 
                Most alternatives are single-user tools.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '0.95rem' }}>
                <CheckCircle size={18} weight="fill" />
                <span>Role-based access control</span>
              </div>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
                  borderRadius: '12px', 
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TrendUp size={28} color="#fff" />
                </div>
                <h3 style={{ fontSize: '1.3rem', color: '#222', margin: 0 }}>Advanced Analytics</h3>
              </div>
              <p style={{ color: '#666', lineHeight: 1.7, marginBottom: '1rem' }}>
                Go beyond simple event viewing. Get usage analytics, performance metrics, failure rates, 
                and insights that help you optimize your webhook infrastructure.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '0.95rem' }}>
                <CheckCircle size={18} weight="fill" />
                <span>Real-time dashboards & charts</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ 
            padding: '2rem', 
            background: 'linear-gradient(135deg, rgba(45,108,223,0.05) 0%, rgba(102,126,234,0.05) 100%)',
            border: '2px solid rgba(45,108,223,0.1)'
          }}>
            <h3 style={{ fontSize: '1.5rem', color: '#222', marginBottom: '1.5rem', textAlign: 'center' }}>
              What Makes Us Unique?
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <CheckCircle size={20} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '0.2rem' }} weight="fill" />
                <div>
                  <strong style={{ color: '#222', display: 'block', marginBottom: '0.3rem' }}>Enterprise Security</strong>
                  <span style={{ color: '#666', fontSize: '0.95rem' }}>API key rotation, audit logs, IP whitelisting</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <CheckCircle size={20} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '0.2rem' }} weight="fill" />
                <div>
                  <strong style={{ color: '#222', display: 'block', marginBottom: '0.3rem' }}>Smart Alerting</strong>
                  <span style={{ color: '#666', fontSize: '0.95rem' }}>Email, Discord, and webhook notifications</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <CheckCircle size={20} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '0.2rem' }} weight="fill" />
                <div>
                  <strong style={{ color: '#222', display: 'block', marginBottom: '0.3rem' }}>Webhook Replay</strong>
                  <span style={{ color: '#666', fontSize: '0.95rem' }}>Retry failed events with one click</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <CheckCircle size={20} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '0.2rem' }} weight="fill" />
                <div>
                  <strong style={{ color: '#222', display: 'block', marginBottom: '0.3rem' }}>Production Ready</strong>
                  <span style={{ color: '#666', fontSize: '0.95rem' }}>99.9% uptime SLA, scalable infrastructure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{ padding: '4rem 2rem', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '1rem', color: '#222' }}>
            Simple, Transparent Pricing
          </h2>
          <p style={{ textAlign: 'center', fontSize: '1.1rem', color: '#666', marginBottom: '3rem' }}>
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginTop: '2rem'
          }}>
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className="card"
                style={{
                  textAlign: 'center',
                  padding: '2.5rem 2rem',
                  border: plan.highlight ? '3px solid var(--primary)' : '1px solid var(--border)',
                  transform: plan.highlight ? 'scale(1.05)' : 'scale(1)',
                  position: 'relative'
                }}
              >
                {plan.highlight && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--primary)',
                    color: '#fff',
                    padding: '0.3rem 1rem',
                    borderRadius: '1rem',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}>
                    Most Popular
                  </div>
                )}
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#222' }}>
                  {plan.name}
                </h3>
                <div style={{ marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 700, color: '#222' }}>
                    {plan.price}
                  </span>
                  <span style={{ color: '#666' }}>{plan.period}</span>
                </div>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '1.5rem 0',
                  textAlign: 'left'
                }}>
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} style={{
                      padding: '0.5rem 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <CheckCircle size={20} style={{ color: 'var(--success)', flexShrink: 0 }} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={user ? "/checkout" : "/signup"}
                  className="btn"
                  style={{
                    width: '100%',
                    marginTop: '1rem',
                    background: plan.highlight ? 'var(--primary)' : 'var(--surface)',
                    color: plan.highlight ? '#fff' : 'var(--primary)',
                    border: plan.highlight ? 'none' : '2px solid var(--primary)'
                  }}
                  onClick={(e) => {
                    if (!user && plan.name !== 'Free') {
                      e.preventDefault();
                      navigate('/signup');
                    }
                  }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '4rem 2rem',
        background: 'linear-gradient(135deg, #2d6cdf 0%, #1a417a 100%)',
        color: '#fff',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            Ready to Get Started?
          </h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.95 }}>
            Join thousands of developers monitoring their webhooks with Webhook Monitor.
          </p>
          {user ? (
            <Link
              to="/dashboard"
              className="btn"
              style={{
                background: '#fff',
                color: '#2d6cdf',
                fontSize: '1.1rem',
                padding: '1rem 2.5rem'
              }}
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              to="/signup"
              className="btn"
              style={{
                background: '#fff',
                color: '#2d6cdf',
                fontSize: '1.1rem',
                padding: '1rem 2.5rem'
              }}
            >
              Start Free Trial
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
