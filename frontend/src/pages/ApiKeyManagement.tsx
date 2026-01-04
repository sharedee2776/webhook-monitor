import React, { useState } from 'react';
import Toast from '../components/Toast';

const ApiKeyManagement: React.FC = () => {
  // Dummy API key data
  const [apiKeys, setApiKeys] = useState([
    { id: 1, key: 'sk_live_123456', created: '2025-12-01' },
  ]);
  const [newKey, setNewKey] = useState('');
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null);

  const handleGenerate = () => {
    const generated = 'sk_live_' + Math.random().toString(36).slice(2, 10);
    setApiKeys([...apiKeys, { id: apiKeys.length + 1, key: generated, created: new Date().toISOString().slice(0, 10) }]);
    setNewKey(generated);
    setToast({ message: 'New API key generated!', type: 'success' });
  };

  return (
    <div style={{ margin: '2rem 0', padding: '1rem', background: '#f0e5ff', borderRadius: 8, position: 'relative' }}>
      <h2>API Key Management</h2>
      <button onClick={handleGenerate} style={{ marginBottom: '1rem' }}>Generate New API Key</button>
      {newKey && <div style={{ color: 'green', marginBottom: '1rem' }}>New Key: {newKey}</div>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {apiKeys.map(key => (
          <li key={key.id} style={{ marginBottom: '0.5rem' }}>
            <span style={{ fontFamily: 'monospace' }}>{key.key}</span> <span style={{ color: '#888' }}>({key.created})</span>
          </li>
        ))}
      </ul>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ApiKeyManagement;
