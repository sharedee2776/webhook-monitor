import React, { useState, useEffect } from 'react';
import Toast from '../components/Toast';
import { Key, Copy, ArrowClockwise } from '@phosphor-icons/react';
import apiConfig from '../config/api';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { handleApiResponse, handleError } from '../utils/errorHandler';

interface ApiKey {
  key: string;
  fullKey: string;
  active: boolean;
  createdAt?: string;
  expiresAt?: string;
}

const ApiKeyManagement: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [tenantId, setTenantId] = useState<string>('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const storedTenantId = localStorage.getItem('tenantId') || firebaseUser.uid;
        setTenantId(storedTenantId);
        if (!localStorage.getItem('tenantId')) {
          localStorage.setItem('tenantId', storedTenantId);
        }
        // Always initialize tenant and API key on first login
        try {
          const response = await fetch(apiConfig.endpoints.initializeTenant, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tenantId: storedTenantId, plan: 'free' })
          });
          const data = await response.json();
          if (data.apiKey) {
            localStorage.setItem('apiKey', data.apiKey);
            setToast({ message: 'API key generated and tenant initialized!', type: 'success' });
          }
        } catch (err) {
          setToast({ message: 'Error initializing tenant or API key. Please try again.', type: 'error' });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchApiKeys = async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // First, try to initialize tenant if it doesn't exist
      try {
        await fetch(apiConfig.endpoints.initializeTenant, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId, plan: 'free' })
        });
      } catch (initError) {
        // Tenant might already exist, that's okay
        console.log('Tenant initialization:', initError);
      }

      // Get API key from localStorage (if user has one)
      const storedApiKey = localStorage.getItem('apiKey');
      
      if (!storedApiKey) {
        // No API key in localStorage, show instructions
        setLoading(false);
        return;
      }

      // Fetch API keys from server
      const response = await fetch(apiConfig.endpoints.listApiKeys, {
        headers: {
          'x-api-key': storedApiKey
        }
      });

      if (response.status === 401) {
        // API key invalid, try to initialize tenant and get new key
        const initResponse = await fetch(apiConfig.endpoints.initializeTenant, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId, plan: 'free' })
        });

        if (initResponse.ok) {
          const initData: any = await handleApiResponse(initResponse);
          if (initData.apiKey) {
            localStorage.setItem('apiKey', initData.apiKey);
            setToast({ message: 'API key generated! Please refresh to see it.', type: 'success' });
            // Retry fetching
            await fetchApiKeys();
            return;
          }
        }
      }

      const data: any = await handleApiResponse(response);
      if (data.keys && Array.isArray(data.keys)) {
        setApiKeys(data.keys);
      } else {
        setApiKeys([]);
      }
    } catch (error: any) {
      handleError(error, (msg) => setToast({ message: msg, type: 'error' }));
      // Fallback to localStorage
      const storedKey = localStorage.getItem('apiKey');
      if (storedKey) {
        setApiKeys([{
          key: storedKey.substring(0, 8) + '...' + storedKey.slice(-4),
          fullKey: storedKey,
          active: true,
          createdAt: 'Stored locally'
        }]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && tenantId) {
      fetchApiKeys();
    } else {
      setLoading(false);
    }
  }, [user, tenantId]);

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setToast({ message: 'API key copied to clipboard!', type: 'success' });
  };

  const handleInitialize = async () => {
    if (!tenantId) {
      setToast({ message: 'Please sign in to generate an API key', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(apiConfig.endpoints.initializeTenant, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, plan: 'free' })
      });

      const data: any = await handleApiResponse(response);
      if (data.apiKey) {
        localStorage.setItem('apiKey', data.apiKey);
        setToast({ message: 'API key generated successfully!', type: 'success' });
        await fetchApiKeys();
      }
    } catch (error: any) {
      handleError(error, (msg) => setToast({ message: msg, type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        <p>Please sign in to manage your API keys.</p>
      </div>
    );
  }

  return (
    <div style={{ margin: '2rem 0', padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
          <Key size={20} /> API Keys
        </h3>
        <button
          onClick={handleInitialize}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            background: '#4f46e5',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.9rem'
          }}
        >
          <ArrowClockwise size={16} />
          {loading ? 'Loading...' : 'Generate API Key'}
        </button>
      </div>
      
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '3px solid #e0e0e0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '0.5rem' }}></div>
          <div>Loading API keys...</div>
        </div>
      )}
      
      {!loading && apiKeys.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', background: '#f8f9fa', borderRadius: 8, color: '#666' }}>
          <p style={{ marginBottom: '0.5rem' }}>No API keys found.</p>
          <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
            Generate an API key to start using the webhook monitoring API.
          </p>
          <button
            onClick={handleInitialize}
            style={{
              padding: '0.7rem 1.5rem',
              background: '#4f46e5',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600
            }}
          >
            Generate API Key
          </button>
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff', borderRadius: 6, textAlign: 'left', fontSize: '0.85rem' }}>
            <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>How to use your API key:</p>
            <ol style={{ paddingLeft: '1.5rem', margin: 0, lineHeight: 1.8 }}>
              <li>Copy your API key after generating it</li>
              <li>Include it in requests as: <code style={{ background: '#f0f0f0', padding: '0.2rem 0.4rem', borderRadius: 4 }}>x-api-key</code> header</li>
              <li>For write operations, you'll also need to sign requests (see documentation)</li>
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
                  {keyData.createdAt && keyData.createdAt !== 'Stored locally' && (
                    <>Created: {new Date(keyData.createdAt).toLocaleDateString()}</>
                  )}
                  {keyData.createdAt === 'Stored locally' && <>Stored locally</>}
                  {keyData.active && <span style={{ marginLeft: '0.5rem', color: '#22c55e' }}>● Active</span>}
                  {!keyData.active && <span style={{ marginLeft: '0.5rem', color: '#ef4444' }}>● Inactive</span>}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                  {keyData.fullKey}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleCopy(keyData.fullKey)}
                  style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: 4, background: '#fff', cursor: 'pointer' }}
                  title="Copy"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>
          ))}
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff3cd', borderRadius: 6, fontSize: '0.85rem', color: '#856404' }}>
            <strong>Security Note:</strong> Keep your API keys secure. Never commit them to version control or expose them publicly.
          </div>
        </div>
      )}
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ApiKeyManagement;
