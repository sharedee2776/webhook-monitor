import React, { useState } from 'react';
import { Info, X } from '@phosphor-icons/react';

const OnboardingModal: React.FC = () => {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(34,42,60,0.18)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(45,108,223,0.18)', padding: '2.5rem 2rem', maxWidth: 400, width: '90%', textAlign: 'center', position: 'relative' }}>
        <button onClick={() => setOpen(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Close">
          <X size={22} />
        </button>
        <Info size={36} color="var(--primary)" style={{ marginBottom: 12 }} />
        <h2 style={{ marginBottom: 8 }}>Welcome to Webhook Monitor!</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: 18 }}>
          Get started by exploring your dashboard, connecting your first webhook, and configuring alerts. Use the navigation menu to access all features.
        </p>
        <ul style={{ textAlign: 'left', margin: '1rem auto', fontSize: '1.05rem', lineHeight: 1.7 }}>
          <li>✔️ Track and replay webhook events</li>
          <li>✔️ Monitor usage and plan limits</li>
          <li>✔️ Manage API keys and team</li>
          <li>✔️ Set up Discord and email alerts</li>
        </ul>
        <button className="btn" style={{ marginTop: 18 }} onClick={() => setOpen(false)}>
          Get Started
        </button>
      </div>
    </div>
  );
};

export default OnboardingModal;
