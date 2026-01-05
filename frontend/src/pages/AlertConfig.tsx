import React, { useState, useEffect } from 'react';
import apiConfig from '../config/api';

const AlertConfig: React.FC = () => {

  const [email, setEmail] = useState('');
  const [threshold, setThreshold] = useState(5);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const apiKey = localStorage.getItem('apiKey') || '';
    if (!apiKey) return setLoading(false);
    fetch(apiConfig.endpoints.alertEmailConfig, {
      headers: { 'x-api-key': apiKey }
    })
      .then(res => res.json())
      .then(data => setEmail(data.email || ''))
      .catch(() => setEmail(''))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setError('');
    setLoading(true);
    const apiKey = localStorage.getItem('apiKey') || '';
    if (!apiKey) {
      setError('API key required');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(apiConfig.endpoints.alertEmailConfig, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({ email })
      });
      if (!res.ok) throw new Error('Failed to save');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Error saving');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ margin: '2rem 0', padding: '1rem', background: '#fff0f0', borderRadius: 8 }}>
      <h2>Alert Configuration</h2>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <form onSubmit={handleSave}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Email for alerts: </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ padding: '0.5rem', marginLeft: '0.5rem' }}
            disabled={loading}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Failure threshold: </label>
          <input
            type="number"
            min={1}
            value={threshold}
            onChange={e => setThreshold(Number(e.target.value))}
            style={{ width: 60, marginLeft: '0.5rem' }}
            disabled={loading}
          />
          <span style={{ marginLeft: '0.5rem' }}>failures</span>
        </div>
        <button type="submit" disabled={loading}>Save</button>
        {saved && <span style={{ color: 'green', marginLeft: '1rem' }}>Saved!</span>}
      </form>
    </div>
  );
};

export default AlertConfig;
