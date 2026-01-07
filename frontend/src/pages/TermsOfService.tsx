import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from '@phosphor-icons/react';

const TermsOfService: React.FC = () => {
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
          <FileText size={32} color="#fff" />
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#222' }}>Terms of Service</h1>
        <p style={{ color: '#666' }}>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="card" style={{ padding: '2rem', lineHeight: 1.8 }}>
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#222', marginBottom: '1rem' }}>1. Acceptance of Terms</h2>
          <p style={{ color: '#666' }}>
            By accessing and using Webhook Monitor ("Service") at webhookmonitor.shop, you accept and agree to be bound by these Terms of Service. If you do not agree, you may not use the Service.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#222', marginBottom: '1rem' }}>2. Description of Service</h2>
          <p style={{ color: '#666' }}>
            Webhook Monitor is a Software-as-a-Service (SaaS) platform that enables users to monitor, analyze, and manage webhook events. The Service includes webhook ingestion, event storage, analytics, alerting, and team collaboration features.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#222', marginBottom: '1rem' }}>3. Account Registration</h2>
          <ul style={{ color: '#666', paddingLeft: '1.5rem' }}>
            <li>You must provide accurate and complete information when creating an account</li>
            <li>You are responsible for maintaining the security of your account credentials</li>
            <li>You must verify your email address to access the Service</li>
            <li>One person or entity may not maintain multiple free accounts</li>
            <li>You are responsible for all activities under your account</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#222', marginBottom: '1rem' }}>4. Subscription Plans and Billing</h2>
          <h3 style={{ color: '#333', marginTop: '1rem', marginBottom: '0.5rem' }}>4.1 Plans</h3>
          <ul style={{ color: '#666', paddingLeft: '1.5rem' }}>
            <li><strong>Free:</strong> 1,000 events/month, basic features</li>
            <li><strong>Pro:</strong> $29/month, 100,000 events/month, advanced features</li>
            <li><strong>Team:</strong> $99/month, 1,000,000 events/month, team features</li>
          </ul>

          <h3 style={{ color: '#333', marginTop: '1rem', marginBottom: '0.5rem' }}>4.2 Billing</h3>
          <ul style={{ color: '#666', paddingLeft: '1.5rem' }}>
            <li>Subscriptions are billed monthly in advance</li>
            <li>Payment is processed securely through Stripe</li>
            <li>You can upgrade, downgrade, or cancel at any time</li>
            <li>Refunds are provided on a case-by-case basis</li>
            <li>Price changes will be communicated 30 days in advance</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#222', marginBottom: '1rem' }}>5. Acceptable Use</h2>
          <p style={{ color: '#666', marginBottom: '1rem' }}>You agree NOT to:</p>
          <ul style={{ color: '#666', paddingLeft: '1.5rem' }}>
            <li>Use the Service for illegal purposes or in violation of any laws</li>
            <li>Send malicious, harmful, or spam webhooks</li>
            <li>Attempt to gain unauthorized access to the Service or other accounts</li>
            <li>Interfere with or disrupt the Service or servers</li>
            <li>Reverse engineer, decompile, or disassemble the Service</li>
            <li>Use automated systems to abuse or overload the Service</li>
            <li>Share API keys with unauthorized parties</li>
            <li>Violate any third-party rights or intellectual property</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#222', marginBottom: '1rem' }}>6. Rate Limits and Fair Use</h2>
          <p style={{ color: '#666' }}>
            Each subscription plan has specific rate limits. Exceeding limits may result in throttling or suspension. We reserve the right to enforce fair use policies and may limit or suspend accounts that abuse the Service.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#222', marginBottom: '1rem' }}>7. Data and Content</h2>
          <h3 style={{ color: '#333', marginTop: '1rem', marginBottom: '0.5rem' }}>7.1 Your Data</h3>
          <p style={{ color: '#666' }}>
            You retain ownership of all data you send to the Service. You grant us a license to store, process, and display your data to provide the Service.
          </p>

          <h3 style={{ color: '#333', marginTop: '1rem', marginBottom: '0.5rem' }}>7.2 Data Retention</h3>
          <p style={{ color: '#666' }}>
            We retain your data according to your plan limits. Free tier: 7 days. Pro/Team: 90+ days. You can export your data at any time. We may delete data after account cancellation or extended inactivity.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#222', marginBottom: '1rem' }}>8. Intellectual Property</h2>
          <p style={{ color: '#666' }}>
            The Service, including all software, designs, text, graphics, and other content, is owned by Webhook Monitor and protected by copyright and other intellectual property laws. You may not copy, modify, or create derivative works without permission.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#222', marginBottom: '1rem' }}>9. Service Availability</h2>
          <p style={{ color: '#666' }}>
            We strive for 99.9% uptime but do not guarantee uninterrupted service. The Service may be unavailable due to maintenance, updates, or unforeseen circumstances. We are not liable for any losses resulting from Service unavailability.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#222', marginBottom: '1rem' }}>10. Termination</h2>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            Either party may terminate this agreement at any time:
          </p>
          <ul style={{ color: '#666', paddingLeft: '1.5rem' }}>
            <li>You may cancel your subscription at any time</li>
            <li>We may suspend or terminate accounts that violate these Terms</li>
            <li>Upon termination, your access will be revoked</li>
            <li>Data may be deleted after a reasonable retention period</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#222', marginBottom: '1rem' }}>11. Limitation of Liability</h2>
          <p style={{ color: '#666' }}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WEBHOOK MONITOR SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#222', marginBottom: '1rem' }}>12. Indemnification</h2>
          <p style={{ color: '#666' }}>
            You agree to indemnify and hold harmless Webhook Monitor from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Service or violation of these Terms.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#222', marginBottom: '1rem' }}>13. Changes to Terms</h2>
          <p style={{ color: '#666' }}>
            We reserve the right to modify these Terms at any time. Material changes will be communicated via email or through the Service. Continued use after changes constitutes acceptance of the new Terms.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#222', marginBottom: '1rem' }}>14. Governing Law</h2>
          <p style={{ color: '#666' }}>
            These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#222', marginBottom: '1rem' }}>15. Contact Information</h2>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            For questions about these Terms, please contact us:
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

export default TermsOfService;
