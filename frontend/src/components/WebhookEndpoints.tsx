
import React, { useState, useEffect } from 'react';


const WebhookEndpoints: React.FC = () => {
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const apiKey = localStorage.getItem('apiKey') || '';

  useEffect(() => {
    if (!apiKey) return setLoading(false);
    fetch('/api/webhook/endpoints', {
      headers: { 'x-api-key': apiKey }
    })
      .then(res => res.json())
      .then(data => setEndpoints(data.endpoints || []))
      .catch(() => setEndpoints([]))
      .finally(() => setLoading(false));
  }, [apiKey]);

  const addEndpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !url) return;
    try {
      const res = await fetch('/api/webhook/endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({ name, url, active: true })
      });
      if (!res.ok) throw new Error('Failed to add endpoint');
      const data = await res.json();
      setEndpoints((prev) => [...prev, data.endpoint]);
      setName('');
      setUrl('');
    } catch (err: any) {
      setError(err.message || 'Error adding endpoint');
    }
  };

  const toggleActive = async (id: number) => {
    // For demo, just toggle locally. For real, add PATCH/PUT to backend.
    setEndpoints(endpoints.map(ep => ep.id === id ? { ...ep, active: !ep.active } : ep));
  };

  const removeEndpoint = async (id: number) => {
    setError('');
    try {
      const res = await fetch('/api/webhook/endpoints', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error('Failed to remove endpoint');
      const data = await res.json();
      setEndpoints(data.endpoints || []);
    } catch (err: any) {
      setError(err.message || 'Error removing endpoint');
    }
  };

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2>Webhook Endpoints</h2>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <form onSubmit={addEndpoint} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Endpoint Name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ padding: '0.5rem', flex: 1 }}
          disabled={loading}
        />
        <input
          type="url"
          placeholder="Endpoint URL"
          value={url}
          onChange={e => setUrl(e.target.value)}
          style={{ padding: '0.5rem', flex: 2 }}
          disabled={loading}
        />
        <button type="submit" style={{ padding: '0.5rem 1.5rem' }} disabled={loading}>Add</button>
      </form>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
        <thead style={{ background: '#f5f5f5' }}>
          <tr>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>URL</th>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Active</th>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {endpoints.map(ep => (
            <tr key={ep.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.75rem' }}>{ep.name}</td>
              <td style={{ padding: '0.75rem' }}>{ep.url}</td>
              <td style={{ padding: '0.75rem' }}>
                <input type="checkbox" checked={ep.active} onChange={() => toggleActive(ep.id)} disabled={loading} />
              </td>
              <td style={{ padding: '0.75rem' }}>
                <button onClick={() => removeEndpoint(ep.id)} style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }} disabled={loading}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WebhookEndpoints;
