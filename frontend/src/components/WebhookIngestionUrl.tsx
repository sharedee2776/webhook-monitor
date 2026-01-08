import React, { useState, useEffect } from 'react';
import { Copy, CheckCircle, Code, Rocket, Key } from '@phosphor-icons/react';
import apiConfig from '../config/api';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface PlanInfo {
  plan: string;
  eventsLimit: number;
  apiKeysLimit: number;
  eventsUsed: number;
}

const WebhookIngestionUrl: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [copied, setCopied] = useState<string>('');
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [tenantId, setTenantId] = useState<string>('');

  const ingestionUrl = `${apiConfig.baseUrl}/api/ingest`;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const storedTenantId = localStorage.getItem('tenantId') || firebaseUser.uid;
        setTenantId(storedTenantId);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Get API key from localStorage
    const storedApiKey = localStorage.getItem('apiKey') || '';
    setApiKey(storedApiKey);

    // Fetch plan info
    if (tenantId) {
      fetch(`${apiConfig.endpoints.tenantPlan}?tenantId=${encodeURIComponent(tenantId)}`)
        .then(res => res.json())
        .then(data => {
          const planLimits: Record<string, { events: number; apiKeys: number }> = {
            free: { events: 1000, apiKeys: 1 },
            pro: { events: 100000, apiKeys: 5 },
            team: { events: 1000000, apiKeys: 20 }
          };
          const currentPlan = data.plan || 'free';
          const limits = planLimits[currentPlan] || planLimits.free;
          setPlanInfo({
            plan: currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1),
            eventsLimit: limits.events,
            apiKeysLimit: limits.apiKeys,
            eventsUsed: data.usage || 0
          });
        })
        .catch(() => {
          setPlanInfo({
            plan: 'Free',
            eventsLimit: 1000,
            apiKeysLimit: 1,
            eventsUsed: 0
          });
        });
    }
  }, [tenantId]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  const curlExample = `curl -X POST ${ingestionUrl} \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey || 'YOUR_API_KEY'}" \\
  -H "x-signature: YOUR_SIGNATURE" \\
  -H "x-timestamp: $(date +%s)" \\
  -d '{
    "eventType": "test_event",
    "payload": {
      "message": "Hello from Webhook Monitor!"
    }
  }'`;

  const javascriptExample = `const timestamp = Date.now().toString();
const body = JSON.stringify({
  eventType: 'test_event',
  payload: { message: 'Hello from Webhook Monitor!' }
});
const signature = await crypto.subtle.digest(
  'SHA-256',
  new TextEncoder().encode(body + timestamp + '${apiKey || 'YOUR_API_KEY'}')
).then(hash => Array.from(new Uint8Array(hash))
  .map(b => b.toString(16).padStart(2, '0')).join(''));

fetch('${ingestionUrl}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${apiKey || 'YOUR_API_KEY'}',
    'x-signature': signature,
    'x-timestamp': timestamp
  },
  body: body
});`;

  const pythonExample = `import requests
import hmac
import hashlib
import time

api_key = '${apiKey || 'YOUR_API_KEY'}'
url = '${ingestionUrl}'
timestamp = str(int(time.time()))
body = {
    "eventType": "test_event",
    "payload": {"message": "Hello from Webhook Monitor!"}
}
body_str = json.dumps(body)
signature = hmac.new(
    api_key.encode(),
    (body_str + timestamp + api_key).encode(),
    hashlib.sha256
).hexdigest()

response = requests.post(
    url,
    json=body,
    headers={
        'x-api-key': api_key,
        'x-signature': signature,
        'x-timestamp': timestamp
    }
)`;


  if (!apiKey) {
    return (
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
        border: '2px solid rgba(102, 126, 234, 0.2)',
        padding: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            borderRadius: '12px', 
            padding: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Rocket size={24} color="#fff" />
          </div>
          <h3 style={{ fontSize: '1.3rem', color: '#222', margin: 0 }}>Get Started with Webhooks</h3>
        </div>
        <p style={{ color: '#666', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Generate an API key first to get your webhook ingestion URL and start sending events.
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
          <Key size={18} /> Generate API Key
        </a>
      </div>
    );
  }

  return (
    <div className="card" style={{ 
      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
      border: '2px solid rgba(102, 126, 234, 0.2)',
      padding: '2rem',
      marginBottom: '2rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          borderRadius: '12px', 
          padding: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Rocket size={24} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.3rem', color: '#222', margin: '0 0 0.25rem 0' }}>Your Webhook URL</h3>
          <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
            Send POST requests to this endpoint with your API key
          </p>
        </div>
      </div>

      {/* Ingestion URL */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontSize: '0.9rem', 
          fontWeight: 600, 
          color: '#374151' 
        }}>
          Webhook Ingestion Endpoint
        </label>
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem',
          alignItems: 'center'
        }}>
          <code style={{ 
            flex: 1,
            padding: '0.75rem 1rem',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontFamily: 'monospace',
            wordBreak: 'break-all',
            color: '#222'
          }}>
            {ingestionUrl}
          </code>
          <button
            onClick={() => copyToClipboard(ingestionUrl, 'url')}
            style={{
              padding: '0.75rem 1rem',
              background: copied === 'url' ? '#10b981' : 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600,
              transition: 'background 0.2s'
            }}
          >
            {copied === 'url' ? <CheckCircle size={18} /> : <Copy size={18} />}
            {copied === 'url' ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* API Key */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontSize: '0.9rem', 
          fontWeight: 600, 
          color: '#374151' 
        }}>
          Your API Key
        </label>
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem',
          alignItems: 'center'
        }}>
          <code style={{ 
            flex: 1,
            padding: '0.75rem 1rem',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontFamily: 'monospace',
            wordBreak: 'break-all',
            color: '#222'
          }}>
            {apiKey}
          </code>
          <button
            onClick={() => copyToClipboard(apiKey, 'key')}
            style={{
              padding: '0.75rem 1rem',
              background: copied === 'key' ? '#10b981' : 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600,
              transition: 'background 0.2s'
            }}
          >
            {copied === 'key' ? <CheckCircle size={18} /> : <Copy size={18} />}
            {copied === 'key' ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Plan Limits */}
      {planInfo && (
        <div style={{ 
          marginBottom: '1.5rem',
          padding: '1rem',
          background: '#fff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '1rem',
            fontSize: '0.9rem'
          }}>
            <div>
              <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Plan</div>
              <div style={{ fontWeight: 600, color: '#222' }}>{planInfo.plan}</div>
            </div>
            <div>
              <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Events Used</div>
              <div style={{ fontWeight: 600, color: '#222' }}>
                {planInfo.eventsUsed.toLocaleString()} / {planInfo.eventsLimit.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>API Keys Limit</div>
              <div style={{ fontWeight: 600, color: '#222' }}>{planInfo.apiKeysLimit}</div>
            </div>
          </div>
        </div>
      )}

      {/* Code Examples */}
      <div style={{ marginTop: '1.5rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          marginBottom: '1rem' 
        }}>
          <Code size={20} style={{ color: 'var(--primary)' }} />
          <h4 style={{ fontSize: '1rem', color: '#222', margin: 0 }}>Code Examples</h4>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '1rem' 
        }}>
          {/* cURL */}
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '0.5rem' 
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>cURL</span>
              <button
                onClick={() => copyToClipboard(curlExample, 'curl')}
                style={{
                  padding: '0.25rem 0.5rem',
                  background: 'transparent',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                {copied === 'curl' ? <CheckCircle size={12} /> : <Copy size={12} />}
                Copy
              </button>
            </div>
            <pre style={{ 
              padding: '0.75rem',
              background: '#1e1e1e',
              color: '#d4d4d4',
              borderRadius: '6px',
              fontSize: '0.75rem',
              overflow: 'auto',
              margin: 0,
              fontFamily: 'monospace'
            }}>
              {curlExample}
            </pre>
          </div>

          {/* JavaScript */}
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '0.5rem' 
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>JavaScript</span>
              <button
                onClick={() => copyToClipboard(javascriptExample, 'js')}
                style={{
                  padding: '0.25rem 0.5rem',
                  background: 'transparent',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                {copied === 'js' ? <CheckCircle size={12} /> : <Copy size={12} />}
                Copy
              </button>
            </div>
            <pre style={{ 
              padding: '0.75rem',
              background: '#1e1e1e',
              color: '#d4d4d4',
              borderRadius: '6px',
              fontSize: '0.75rem',
              overflow: 'auto',
              margin: 0,
              fontFamily: 'monospace'
            }}>
              {javascriptExample}
            </pre>
          </div>

          {/* Python */}
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '0.5rem' 
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>Python</span>
              <button
                onClick={() => copyToClipboard(pythonExample, 'python')}
                style={{
                  padding: '0.25rem 0.5rem',
                  background: 'transparent',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                {copied === 'python' ? <CheckCircle size={12} /> : <Copy size={12} />}
                Copy
              </button>
            </div>
            <pre style={{ 
              padding: '0.75rem',
              background: '#1e1e1e',
              color: '#d4d4d4',
              borderRadius: '6px',
              fontSize: '0.75rem',
              overflow: 'auto',
              margin: 0,
              fontFamily: 'monospace'
            }}>
              {pythonExample}
            </pre>
          </div>
        </div>
      </div>

      {/* Important Note */}
      <div style={{ 
        marginTop: '1.5rem',
        padding: '1rem',
        background: '#fef3c7',
        border: '1px solid #fbbf24',
        borderRadius: '8px',
        fontSize: '0.85rem',
        color: '#92400e'
      }}>
        <strong>⚠️ Important:</strong> All POST requests to the ingestion endpoint require request signing with HMAC-SHA256. 
        Include <code style={{ background: '#fff', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>x-signature</code> and <code style={{ background: '#fff', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>x-timestamp</code> headers. 
        See the <a href="/docs" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>documentation</a> for details.
      </div>
    </div>
  );
};

export default WebhookIngestionUrl;
