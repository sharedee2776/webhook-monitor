import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const PlanDetails: React.FC = () => {
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const tenantId = localStorage.getItem('tenantId') || '';
    if (!tenantId) {
      setError('No tenant ID found.');
      setLoading(false);
      return;
    }
    fetch('/api/tenant/plan?tenantId=' + encodeURIComponent(tenantId))
      .then(res => res.json())
      .then(data => setPlan(data.plan))
      .catch(() => setError('Could not load plan details.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 500, margin: '3rem auto', padding: '2rem', textAlign: 'center' }}>
      <h2>Subscription Details</h2>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {plan && <div style={{ fontSize: '1.2em', margin: '1rem 0' }}>Current Plan: <strong>{plan.toUpperCase()}</strong></div>}
      <Link to="/dashboard" style={{ color: '#646cff', textDecoration: 'underline' }}>Go to Dashboard</Link>
    </div>
  );
};

export default PlanDetails;
