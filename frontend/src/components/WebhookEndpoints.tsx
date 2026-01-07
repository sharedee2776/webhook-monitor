
import React, { useState, useEffect } from 'react';
import apiConfig from '../config/api';
import { Plug, Plus, ArrowRight } from '@phosphor-icons/react';


const WebhookEndpoints: React.FC = () => {
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const apiKey = localStorage.getItem('apiKey') || '';

  useEffect(() => {
    if (!apiKey) return setLoading(false);
    fetch(apiConfig.endpoints.webhookEndpoints, {
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
      const res = await fetch(apiConfig.endpoints.webhookEndpoints, {
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
      const res = await fetch(apiConfig.endpoints.webhookEndpoints, {
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

  if (!apiKey) {
    return (
      <div style={{ 
        padding: '3rem 2rem', 
        textAlign: 'center', 
        background: '#f8f9fa', 
        borderRadius: 12,
        border: '2px dashed #dee2e6'
      }}>
        <Plug size={48} style={{ color: '#6c757d', marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#222' }}>No API Key Found</h3>
        <p style={{ color: '#666', marginBottom: '1.5rem', maxWidth: 400, margin: '0 auto 1.5rem' }}>
          You need an API key to manage webhook endpoints. Generate one in the API Keys section first.
        </p>
        <a 
          href="#api-keys"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('api-keys')?.scrollIntoView({ behavior: 'smooth' });
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: 'var(--primary)',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: 8,
            fontWeight: 600
          }}
        >
          Get API Key <ArrowRight size={18} />
        </a>
      </div>
    );
  }

  return (
    <div style={{ margin: '1rem 0' }}>
      {loading && (
        <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
          <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '3px solid #e0e0e0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
          <span style={{ marginLeft: '0.5rem' }}>Loading endpoints...</span>
        </div>
      )}
      {error && (
        <div style={{ 
          padding: '1rem', 
          background: '#ffebee', 
          color: '#d32f2f', 
          borderRadius: 8, 
          marginBottom: '1rem' 
        }}>
          {error}
        </div>
      )}
      <form onSubmit={addEndpoint} style={{ 
        display: 'flex', 
        gap: '0.75rem', 
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Endpoint Name (e.g., Production Server)"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ 
            padding: '0.75rem', 
            flex: '1 1 200px',
            border: '1px solid #ddd',
            borderRadius: 6,
            fontSize: '0.95rem'
          }}
          disabled={loading}
        />
        <input
          type="url"
          placeholder="https://your-server.com/webhook"
          value={url}
          onChange={e => setUrl(e.target.value)}
          style={{ 
            padding: '0.75rem', 
            flex: '2 1 300px',
            border: '1px solid #ddd',
            borderRadius: 6,
            fontSize: '0.95rem'
          }}
          disabled={loading}
        />
        <button 
          type="submit" 
          style={{ 
            padding: '0.75rem 1.5rem',
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }} 
          disabled={loading}
        >
          <Plus size={18} /> Add Endpoint
        </button>
      </form>
      {endpoints.length === 0 ? (
        <div style={{ 
          padding: '3rem 2rem', 
          textAlign: 'center', 
          background: '#f8f9fa', 
          borderRadius: 12,
          border: '2px dashed #dee2e6'
        }}>
          <Plug size={48} style={{ color: '#6c757d', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#222' }}>No Endpoints Yet</h3>
          <p style={{ color: '#666', marginBottom: '1.5rem', maxWidth: 400, margin: '0 auto 1.5rem' }}>
            Create your first webhook endpoint to start receiving and monitoring webhook events. 
            Add a name and URL above to get started.
          </p>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            <strong>Next steps:</strong>
            <ol style={{ textAlign: 'left', maxWidth: 300, margin: '1rem auto', paddingLeft: '1.5rem' }}>
              <li>Add an endpoint above</li>
              <li>Configure your webhook sender</li>
              <li>Start receiving events!</li>
            </ol>
          </div>
        </div>
      ) : (
        <div style={{ 
          background: '#fff', 
          borderRadius: 8, 
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>Name</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>URL</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>Active</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map(ep => (
                <tr key={ep.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{ep.name}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#666', fontFamily: 'monospace', fontSize: '0.85rem' }}>{ep.url}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <input 
                      type="checkbox" 
                      checked={ep.active} 
                      onChange={() => toggleActive(ep.id)} 
                      disabled={loading}
                      style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button 
                      onClick={() => removeEndpoint(ep.id)} 
                      style={{ 
                        color: '#dc2626', 
                        background: 'none', 
                        border: 'none', 
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: 500,
                        fontSize: '0.9rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: 4
                      }} 
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WebhookEndpoints;
