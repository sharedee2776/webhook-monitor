import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from '@phosphor-icons/react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '2rem 1rem' }}>
      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '2rem',
          color: 'var(--primary)',
          textDecoration: 'none',
          fontWeight: 600
        }}
      >
        <ArrowLeft size={18} /> Back to Home
      </Link>

      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '50%', marginBottom: '1rem' }}>
          <Shield size={32} color="#fff" />
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#222' }}>Privacy Policy</h1>
        <p style={{ color: '#666' }}>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="card" style={{ padding: '2rem', lineHeight: 1.8 }}>
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#222', marginBottom: '1rem' }}>1. Introduction</h2>
          <p style={{ color: '#666' }}>
            Webhook Monitor ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our webhook monitoring service at webhookmonitor.shop.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#222', marginBottom: '1rem' }}>2. Information We Collect</h2>
          <h3 style={{ color: '#333', marginTop: '1rem', marginBottom: '0.5rem' }}>2.1 Information You Provide</h3>
          <ul style={{ color: '#666', paddingLeft: '1.5rem' }}>
            <li>Email address and account credentials</li>
            <li>Payment information (processed securely through Stripe)</li>
            <li>Team member information (names, emails, roles)</li>
            <li>Webhook endpoint configurations</li>
            <li>Alert preferences and notification settings</li>
          </ul>

          <h3 style={{ color: '#333', marginTop: '1rem', marginBottom: '0.5rem' }}>2.2 Automatically Collected Information</h3>
          <ul style={{ color: '#666', paddingLeft: '1.5rem' }}>
            <li>Webhook event data sent to our platform</li>
            <li>IP addresses and request metadata</li>
            <li>Usage analytics and performance metrics</li>
            <li>Browser and device information</li>
            <li>Authentication logs and security events</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#222', marginBottom: '1rem' }}>3. How We Use Your Information</h2>
          <ul style={{ color: '#666', paddingLeft: '1.5rem' }}>
            <li>Provide and maintain our webhook monitoring service</li>
            <li>Process payments and manage subscriptions</li>
            <li>Send email verifications and account notifications</li>
            <li>Monitor and analyze usage patterns</li>
            <li>Detect and prevent security threats</li>
            <li>Improve our service and develop new features</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#222', marginBottom: '1rem' }}>4. Data Storage and Security</h2>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            We use industry-standard security measures to protect your data:
          </p>
          <ul style={{ color: '#666', paddingLeft: '1.5rem' }}>
            <li>Data encrypted in transit (HTTPS/TLS)</li>
            <li>Secure storage on Microsoft Azure infrastructure</li>
            <li>API key authentication and request signing</li>
            <li>Regular security audits and monitoring</li>
            <li>Access controls and role-based permissions</li>
          </ul>
          <p style={{ color: '#666', marginTop: '1rem' }}>
            Your webhook event data is stored securely and isolated by tenant. We retain data according to your plan limits (Free: 7 days, Pro: 90 days, Team: 90+ days).
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#222', marginBottom: '1rem' }}>5. Data Sharing and Disclosure</h2>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            We do not sell your personal information. We may share data only in these circumstances:
          </p>
          <ul style={{ color: '#666', paddingLeft: '1.5rem' }}>
            <li><strong>Service Providers:</strong> With trusted third-party services (Stripe for payments, Firebase for authentication, Azure for hosting)</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            <li><strong>Business Transfers:</strong> In connection with a merger or acquisition</li>
            <li><strong>With Your Consent:</strong> When you explicitly authorize sharing</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#222', marginBottom: '1rem' }}>6. Your Rights and Choices</h2>
          <p style={{ color: '#666', marginBottom: '1rem' }}>You have the right to:</p>
          <ul style={{ color: '#666', paddingLeft: '1.5rem' }}>
            <li>Access and download your data</li>
            <li>Update or correct your account information</li>
            <li>Delete your account and data</li>
            <li>Opt-out of marketing communications</li>
            <li>Export your webhook event data</li>
            <li>Request data portability</li>
          </ul>
          <p style={{ color: '#666', marginTop: '1rem' }}>
            To exercise these rights, contact us at <a href="mailto:damoladauda10@gmail.com" style={{ color: 'var(--primary)' }}>damoladauda10@gmail.com</a>
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#222', marginBottom: '1rem' }}>7. Cookies and Tracking</h2>
          <p style={{ color: '#666' }}>
            We use cookies and similar technologies to maintain your session, remember preferences, and analyze usage. You can control cookies through your browser settings. Essential cookies are required for the service to function.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#222', marginBottom: '1rem' }}>8. Children's Privacy</h2>
          <p style={{ color: '#666' }}>
            Our service is not intended for users under 18 years of age. We do not knowingly collect personal information from children.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#222', marginBottom: '1rem' }}>9. International Data Transfers</h2>
          <p style={{ color: '#666' }}>
            Your data may be processed and stored in data centers located outside your country. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#222', marginBottom: '1rem' }}>10. Changes to This Policy</h2>
          <p style={{ color: '#666' }}>
            We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through our service. Continued use after changes constitutes acceptance.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#222', marginBottom: '1rem' }}>11. Contact Us</h2>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            If you have questions about this Privacy Policy or our data practices, please contact us:
          </p>
          <p style={{ color: '#666' }}>
            <strong>Email:</strong> <a href="mailto:damoladauda10@gmail.com" style={{ color: 'var(--primary)' }}>damoladauda10@gmail.com</a><br />
            <strong>Website:</strong> <a href="https://webhookmonitor.shop" style={{ color: 'var(--primary)' }}>webhookmonitor.shop</a>
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
