import React, { useState, useEffect } from 'react';
import Toast from '../components/Toast';
import { Key, Copy, Eye, EyeSlash, Trash } from '@phosphor-icons/react';

const ApiKeyManagement: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<Array<{ key: string; created: string; visible: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    // Load API key from localStorage if available
    const storedKey = localStorage.getItem('apiKey');
    if (storedKey) {
      setApiKeys([{ key: storedKey, created: 'Stored locally', visible: false }]);
    }
    setLoading(false);
  }, []);

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setToast({ message: 'API key copied to clipboard!', type: 'success' });
  };

  const toggleVisibility = (index: number) => {
    const updated = [...apiKeys];
    updated[index].visible = !updated[index].visible;
    setApiKeys(updated);
  };

  const handleDelete = (index: number) => {
    if (confirm('Are you sure you want to remove this API key from local storage?')) {
      const updated = apiKeys.filter((_, i) => i !== index);
      setApiKeys(updated);
      if (updated.length === 0) {
        localStorage.removeItem('apiKey');
      }
      setToast({ message: 'API key removed from local storage', type: 'info' });
    }
  };

  return (
    <div style={{ margin: '2rem 0', padding: '1rem' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
        <Key size={20} /> API Keys
      </h3>
      
      {loading && <div>Loading...</div>}
      
      {!loading && apiKeys.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', background: '#f8f9fa', borderRadius: 8, color: '#666' }}>
          <p style={{ marginBottom: '0.5rem' }}>No API keys found in local storage.</p>
          <p style={{ fontSize: '0.9rem' }}>
            API keys are managed server-side. Contact support or use the admin panel to generate new keys.
          </p>
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff', borderRadius: 6, textAlign: 'left' }}>
            <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}><strong>To use an API key:</strong></p>
            <ol style={{ fontSize: '0.85rem', paddingLeft: '1.5rem', margin: 0 }}>
              <li>Get your API key from your admin or support</li>
              <li>Store it in your application's environment variables</li>
              <li>Include it in requests as: <code style={{ background: '#f0f0f0', padding: '0.2rem 0.4rem', borderRadius: 4 }}>x-api-key</code> header</li>
            </ol>
          </div>
        </div>
      )}

      {!loading && apiKeys.length > 0 && (
        <div>
          {apiKeys.map((keyData, index) => (
            <div key={index} style={{ 
              padding: '1rem', 
              background: '#f8f9fa', 
              borderRadius: 8, 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              justifyContent: 'space-between'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>
                  Created: {keyData.created}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                  {keyData.visible ? keyData.key : '•'.repeat(20) + keyData.key.slice(-4)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => toggleVisibility(index)}
                  style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: 4, background: '#fff', cursor: 'pointer' }}
                  title={keyData.visible ? 'Hide' : 'Show'}
                >
                  {keyData.visible ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
                <button
                  onClick={() => handleCopy(keyData.key)}
                  style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: 4, background: '#fff', cursor: 'pointer' }}
                  title="Copy"
                >
                  <Copy size={18} />
                </button>
                <button
                  onClick={() => handleDelete(index)}
                  style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: 4, background: '#fff', cursor: 'pointer', color: '#d32f2f' }}
                  title="Remove from local storage"
                >
                  <Trash size={18} />
                </button>
              </div>
            </div>
          ))}
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff3cd', borderRadius: 6, fontSize: '0.85rem', color: '#856404' }}>
            <strong>Note:</strong> This shows API keys stored locally in your browser. To generate new keys, contact support or use the admin panel.
          </div>
        </div>
      )}
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ApiKeyManagement;
