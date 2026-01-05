import React, { useState } from 'react';

const plans = [
  { id: 'free', name: 'Free', price: 0, description: 'Free plan with limited features.' },
  { id: 'pro', name: 'Pro', price: 19, description: 'Pro plan with advanced features.' },
  { id: 'team', name: 'Team', price: 49, description: 'Team plan for teams and enterprises.' },
];

const Checkout: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState(plans[0].id);
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Get tenantId from localStorage or prompt user
      let tenantId = localStorage.getItem('tenantId') || '';
      if (!tenantId) {
        tenantId = prompt('Enter your tenant ID:') || '';
        if (tenantId) localStorage.setItem('tenantId', tenantId);
      }
      if (!tenantId) {
        alert('Tenant ID is required.');
        setLoading(false);
        return;
      }
      
      const res = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, plan: selectedPlan }),
      });
      
      // Better error handling
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Checkout error:', errorText);
        
        if (res.status === 404) {
          alert('Checkout service is temporarily unavailable. Please try again later or contact support.');
        } else {
          alert(`Error: ${res.status} - ${errorText || 'Failed to start checkout'}`);
        }
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl; // Redirect to Stripe Checkout
      } else {
        alert('Failed to start checkout. Please try again or contact support.');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      alert('Unable to connect to checkout service. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '3rem auto', padding: '2rem', textAlign: 'center' }}>
      <h2>Upgrade Your Plan</h2>
      <form onSubmit={handleCheckout}>
        <div style={{ marginBottom: '2rem' }}>
          {plans.map(plan => (
            <div key={plan.id} style={{ margin: '1rem 0', padding: '1rem', border: selectedPlan === plan.id ? '2px solid #646cff' : '1px solid #ccc', borderRadius: 8 }}>
              <label>
                <input
                  type="radio"
                  name="plan"
                  value={plan.id}
                  checked={selectedPlan === plan.id}
                  onChange={() => setSelectedPlan(plan.id)}
                  style={{ marginRight: '1rem' }}
                />
                <strong>{plan.name}</strong> — ${plan.price}/mo
                <div style={{ fontSize: '0.9em', color: '#555', marginTop: '0.5rem' }}>{plan.description}</div>
              </label>
            </div>
          ))}
        </div>
        <button type="submit" disabled={loading} style={{ padding: '0.75rem 2rem' }}>
          {loading ? 'Redirecting...' : 'Checkout with Stripe'}
        </button>
      </form>

      {/* Plan Comparison Table */}
      <div style={{ margin: '2.5rem 0 1.5rem 0', textAlign: 'left' }}>
        <h3 style={{ marginBottom: 12, color: '#4f46e5' }}>Compare Plans</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden', fontSize: '1em' }}>
          <thead style={{ background: '#f5f5f5' }}>
            <tr>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Feature</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Free</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Pro</th>
              <th style={{ padding: '0.75rem', textAlign: 'center' }}>Team</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={{ padding: '0.75rem' }}>Events/month</td><td style={{ textAlign: 'center' }}>1,000</td><td style={{ textAlign: 'center' }}>100,000</td><td style={{ textAlign: 'center' }}>1,000,000</td></tr>
            <tr><td style={{ padding: '0.75rem' }}>API Keys</td><td style={{ textAlign: 'center' }}>1</td><td style={{ textAlign: 'center' }}>5</td><td style={{ textAlign: 'center' }}>20</td></tr>
            <tr><td style={{ padding: '0.75rem' }}>Team Members</td><td style={{ textAlign: 'center' }}>1</td><td style={{ textAlign: 'center' }}>1</td><td style={{ textAlign: 'center' }}>10</td></tr>
            <tr><td style={{ padding: '0.75rem' }}>Priority Support</td><td style={{ textAlign: 'center' }}>-</td><td style={{ textAlign: 'center' }}>✔️</td><td style={{ textAlign: 'center' }}>✔️</td></tr>
            <tr><td style={{ padding: '0.75rem' }}>Audit Logs</td><td style={{ textAlign: 'center' }}>-</td><td style={{ textAlign: 'center' }}>✔️</td><td style={{ textAlign: 'center' }}>✔️</td></tr>
            <tr><td style={{ padding: '0.75rem' }}>Integrations</td><td style={{ textAlign: 'center' }}>Basic</td><td style={{ textAlign: 'center' }}>All</td><td style={{ textAlign: 'center' }}>All</td></tr>
          </tbody>
        </table>
      </div>

      {/* Billing FAQ */}
      <div style={{ margin: '2rem 0', textAlign: 'left' }}>
        <h3 style={{ marginBottom: 12, color: '#4f46e5' }}>Billing FAQ</h3>
        <ul style={{ fontSize: '1.05em', lineHeight: 1.7 }}>
          <li><strong>What payment methods are accepted?</strong> — All major credit/debit cards are accepted via Stripe.</li>
          <li><strong>Can I cancel anytime?</strong> — Yes, you can cancel or change your plan at any time from your dashboard.</li>
          <li><strong>Is my payment secure?</strong> — Yes, payments are processed securely by Stripe. We do not store your card details.</li>
          <li><strong>Will I get an invoice?</strong> — Yes, invoices are sent to your email after each payment.</li>
          <li><strong>Need help?</strong> — <a href="mailto:damoladauda10@gmail.com" style={{ color: '#4f46e5', textDecoration: 'underline' }}>Contact support</a> or <a href="https://discord.com/users/your-discord-id" target="_blank" rel="noopener noreferrer" style={{ color: '#5865F2', textDecoration: 'underline' }}>join our Discord</a>.</li>
                  <li><strong>Need help?</strong> — <a href="mailto:damoladauda10@gmail.com" style={{ color: '#4f46e5', textDecoration: 'underline' }}>Contact support</a> or <a href="https://discord.gg/5MnFJ9bAKR" target="_blank" rel="noopener noreferrer" style={{ color: '#5865F2', textDecoration: 'underline' }}>join our Discord</a>.</li>
        </ul>
      </div>
      {/* Secure Payment Badges and Legal Links */}
      <div style={{ margin: '2.5rem 0 0 0', textAlign: 'center' }}>
        <div style={{ marginBottom: 12 }}>
          <img src="https://stripe.com/img/v3/home/social.png" alt="Stripe Secure" style={{ height: 32, verticalAlign: 'middle', marginRight: 10 }} />
          <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" alt="Visa" style={{ height: 28, verticalAlign: 'middle', marginRight: 6 }} />
          <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png" alt="Mastercard" style={{ height: 28, verticalAlign: 'middle', marginRight: 6 }} />
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/AMEX_Logo.svg" alt="Amex" style={{ height: 28, verticalAlign: 'middle', marginRight: 6 }} />
        </div>
        <div style={{ fontSize: '0.98em', color: '#888' }}>
          <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', textDecoration: 'underline', marginRight: 16 }}>Terms</a>
          <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', textDecoration: 'underline' }}>Privacy</a>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
