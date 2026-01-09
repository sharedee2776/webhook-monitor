
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
    if (!apiKey) {
      setLoading(false);
      return;
    }
    fetch(apiConfig.endpoints.webhookEndpoints, {
      headers: { 'x-api-key': apiKey }
    })
      .then(async (res) => {
        if (!res.ok) {
          let errorMessage = 'Failed to load endpoints';
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            const errorText = await res.text();
            errorMessage = errorText || errorMessage;
          }
          
          if (res.status === 401) {
            setError('Authentication failed. Please check your API key.');
          } else if (res.status === 500) {
            setError('Server error. Please try again later.');
          } else {
            setError(errorMessage);
          }
          return { endpoints: [] };
        }
        return res.json();
      })
      .then(data => setEndpoints(data.endpoints || []))
      .catch((err) => {
        console.error('Failed to fetch endpoints:', err);
        setEndpoints([]);
      })
      .finally(() => setLoading(false));
  }, [apiKey]);

  const addEndpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !url) {
      setError('Please provide both name and URL');
      return;
    }
    if (!apiKey) {
      setError('API key is required. Please generate an API key first.');
      return;
    }
    try {
      const res = await fetch(apiConfig.endpoints.webhookEndpoints, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'x-api-key': apiKey 
        },
        body: JSON.stringify({ name, url, active: true })
      });
      
      if (!res.ok) {
        let errorMessage = 'Failed to add endpoint';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          const errorText = await res.text();
          errorMessage = errorText || errorMessage;
        }
        
        if (res.status === 401) {
          throw new Error('Authentication failed. Please check your API key.');
        } else if (res.status === 400) {
          throw new Error(errorMessage);
        } else if (res.status === 500) {
          throw new Error('Server error. Please try again later or contact support.');
        } else {
          throw new Error(`${errorMessage} (Status: ${res.status})`);
        }
      }
      
      const data = await res.json();
      setEndpoints((prev) => [...prev, data.endpoint]);
      setName('');
      setUrl('');
      setError(''); // Clear any previous errors
    } catch (err: any) {
      setError(err.message || 'Error adding endpoint');
    }
  };

  const toggleActive = async (id: string | number) => {
    if (!apiKey) {
      setError('API key is required');
      return;
    }
    
    const endpoint = endpoints.find(ep => ep.id === id);
    if (!endpoint) return;
    
    const newActiveState = !endpoint.active;
    
    try {
      const res = await fetch(`${apiConfig.endpoints.webhookEndpoints}/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          'x-api-key': apiKey 
        },
        body: JSON.stringify({ active: newActiveState })
      });
      
      if (!res.ok) {
        let errorMessage = 'Failed to update endpoint';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          const errorText = await res.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      // Update local state with the response
      setEndpoints(endpoints.map(ep => ep.id === id ? { ...ep, active: data.endpoint?.active ?? newActiveState } : ep));
    } catch (err: any) {
      setError(err.message || 'Error updating endpoint');
    }
  };

  const removeEndpoint = async (id: string | number) => {
    if (!confirm('Are you sure you want to remove this endpoint?')) {
      return;
    }
    
    setError('');
    if (!apiKey) {
      setError('API key is required');
      return;
    }
    
    try {
      const res = await fetch(apiConfig.endpoints.webhookEndpoints, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json', 
          'x-api-key': apiKey 
        },
        body: JSON.stringify({ id: String(id) })
      });
      
      if (!res.ok) {
        let errorMessage = 'Failed to remove endpoint';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          const errorText = await res.text();
          errorMessage = errorText || errorMessage;
        }
        
        if (res.status === 401) {
          throw new Error('Authentication failed. Please check your API key.');
        } else if (res.status === 404) {
          throw new Error('Endpoint not found');
        } else if (res.status === 500) {
          throw new Error('Server error. Please try again later or contact support.');
        } else {
          throw new Error(`${errorMessage} (Status: ${res.status})`);
        }
      }
      
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
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>Created At</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>Last Delivery</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((ep, idx) => (
                <tr key={ep.id} style={{ borderBottom: idx < endpoints.length - 1 ? '1px solid #e5e7eb' : 'none', background: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{ep.name}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#666', fontFamily: 'monospace', fontSize: '0.85rem' }}>{ep.url}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#666' }}>
                    {ep.createdAt ? new Date(ep.createdAt).toLocaleString() : 'N/A'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#666' }}>
                    {ep.lastDeliveryTime ? (
                      <div>
                        <div>{new Date(ep.lastDeliveryTime).toLocaleString()}</div>
                        {ep.lastDeliveryStatus && (
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: ep.lastDeliveryStatus === 'success' ? '#10b981' : 
                                   ep.lastDeliveryStatus === 'failed' ? '#ef4444' : '#6b7280',
                            marginTop: '0.25rem'
                          }}>
                            {ep.lastDeliveryStatus}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Never</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input 
                        type="checkbox" 
                        checked={ep.active !== false} 
                        onChange={() => toggleActive(ep.id)} 
                        disabled={loading}
                        style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
                        title={ep.active ? 'Endpoint is active' : 'Endpoint is disabled'}
                      />
                      <span style={{ fontSize: '0.85rem', color: ep.active !== false ? '#10b981' : '#6b7280' }}>
                        {ep.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => toggleActive(ep.id)} 
                        style={{ 
                          color: ep.active !== false ? '#f59e0b' : '#10b981', 
                          background: 'none', 
                          border: '1px solid #e5e7eb', 
                          cursor: loading ? 'not-allowed' : 'pointer',
                          fontWeight: 500,
                          fontSize: '0.85rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: 4
                        }} 
                        disabled={loading}
                        title={ep.active !== false ? 'Pause endpoint' : 'Activate endpoint'}
                      >
                        {ep.active !== false ? 'Pause' : 'Activate'}
                      </button>
                      <button 
                        onClick={() => removeEndpoint(ep.id)} 
                        style={{ 
                          color: '#dc2626', 
                          background: 'none', 
                          border: '1px solid #e5e7eb', 
                          cursor: loading ? 'not-allowed' : 'pointer',
                          fontWeight: 500,
                          fontSize: '0.85rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: 4
                        }} 
                        disabled={loading}
                        title="Delete endpoint"
                      >
                        Delete
                      </button>
                    </div>
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
