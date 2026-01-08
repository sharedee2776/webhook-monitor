import React, { useState, useEffect } from 'react';
import { Copy, CheckCircle, Code, Rocket, Key, ArrowClockwise } from '@phosphor-icons/react';
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
  const [timestamp, setTimestamp] = useState<string>('');
  const [signature, setSignature] = useState<string>('');
  const [testBody, setTestBody] = useState<string>('{"eventType":"test_event","payload":{"message":"Hello from Webhook Monitor!"}}');
  const [jsonError, setJsonError] = useState<string>('');
  const [signatureLoading, setSignatureLoading] = useState<boolean>(false);
  const [signatureError, setSignatureError] = useState<string>('');
  const [revealedTimestamp, setRevealedTimestamp] = useState<boolean>(false);
  const [revealedSignature, setRevealedSignature] = useState<boolean>(false);

  const ingestionUrl = `${apiConfig.baseUrl}/api/ingest`;

  // Validate JSON
  const validateJSON = (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  };

  // Generate timestamp (current time in milliseconds)
  const generateTimestamp = () => {
    const ts = Date.now().toString();
    setTimestamp(ts);
    setRevealedTimestamp(true);
    return ts;
  };

  // Generate signature: SHA256(body + timestamp + apiKey)
  const generateSignature = async (body: string, ts: string, key: string): Promise<string> => {
    if (!body || !ts || !key) {
      setSignatureError('Missing required values (body, timestamp, or API key)');
      return '';
    }
    
    // Validate JSON
    if (!validateJSON(body)) {
      setSignatureError('Invalid JSON in test body');
      return '';
    }

    try {
      setSignatureError('');
      setSignatureLoading(true);
      const message = body + ts + key;
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (error: any) {
      setSignatureError(error.message || 'Failed to generate signature');
      return '';
    } finally {
      setSignatureLoading(false);
    }
  };

  // Reset revealed states when API key changes
  useEffect(() => {
    if (!apiKey) {
      setRevealedTimestamp(false);
      setRevealedSignature(false);
      setTimestamp('');
      setSignature('');
    }
  }, [apiKey]);

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

  const curlExample = `# Calculate signature first: SHA256(body + timestamp + apiKey)
BODY='{"eventType":"test_event","payload":{"message":"Hello from Webhook Monitor!"}}'
TIMESTAMP=$(date +%s)000  # milliseconds
MESSAGE="$BODY$TIMESTAMP${apiKey || 'YOUR_API_KEY'}"
SIGNATURE=$(echo -n "$MESSAGE" | sha256sum | cut -d' ' -f1)

curl -X POST ${ingestionUrl} \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey || 'YOUR_API_KEY'}" \\
  -H "x-signature: $SIGNATURE" \\
  -H "x-timestamp: $TIMESTAMP" \\
  -d "$BODY"`;

  const javascriptExample = `// Calculate signature: SHA256(body + timestamp + apiKey)
const timestamp = Date.now().toString();
const body = JSON.stringify({
  eventType: 'test_event',
  payload: { message: 'Hello from Webhook Monitor!' }
});
const message = body + timestamp + '${apiKey || 'YOUR_API_KEY'}';
const signature = await crypto.subtle.digest(
  'SHA-256',
  new TextEncoder().encode(message)
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
import hashlib
import json
import time

# Calculate signature: SHA256(body + timestamp + apiKey)
api_key = '${apiKey || 'YOUR_API_KEY'}'
url = '${ingestionUrl}'
timestamp = str(int(time.time() * 1000))  # milliseconds
body = {
    "eventType": "test_event",
    "payload": {"message": "Hello from Webhook Monitor!"}
}
body_str = json.dumps(body)
message = body_str + timestamp + api_key
signature = hashlib.sha256(message.encode()).hexdigest()

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

      {/* Test Body Input */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontSize: '0.9rem', 
          fontWeight: 600, 
          color: '#374151' 
        }}>
          Test Body (JSON) - Used for signature generation
        </label>
        <textarea
          value={testBody}
          onChange={(e) => {
            const value = e.target.value;
            setTestBody(value);
            // Validate JSON on change
            if (value.trim()) {
              if (validateJSON(value)) {
                setJsonError('');
              } else {
                setJsonError('Invalid JSON format. Please check your syntax.');
              }
            } else {
              setJsonError('');
            }
          }}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: jsonError ? '1px solid #ef4444' : '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontFamily: 'monospace',
            minHeight: '100px',
            resize: 'vertical',
            boxSizing: 'border-box',
            background: jsonError ? '#fef2f2' : '#fff'
          }}
          placeholder='{"eventType":"test_event","payload":{"message":"Hello!"}}'
        />
        {jsonError && (
          <div style={{ 
            marginTop: '0.5rem', 
            padding: '0.5rem', 
            background: '#fef2f2', 
            border: '1px solid #fecaca',
            borderRadius: '6px',
            fontSize: '0.8rem',
            color: '#dc2626'
          }}>
            ⚠️ {jsonError}
          </div>
        )}
        {!jsonError && testBody && (
          <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem', margin: '0.5rem 0 0 0' }}>
            ✓ Valid JSON. Modify this to generate signatures for your actual webhook payloads
          </p>
        )}
      </div>

      {/* Required Headers */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.75rem', 
          fontSize: '0.9rem', 
          fontWeight: 600, 
          color: '#374151' 
        }}>
          Required Headers (Generated Values)
        </label>
        <div style={{ 
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          {/* x-api-key */}
          <div style={{ 
            padding: '0.75rem 1rem',
            borderBottom: '1px solid #e5e7eb',
          }}>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.5rem'
            }}>
              <code style={{ 
                minWidth: '120px',
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                color: '#667eea',
                fontWeight: 600
              }}>x-api-key</code>
              <span style={{ fontSize: '0.85rem', color: '#666', flex: 1 }}>Your API key (required)</span>
              <button
                onClick={() => copyToClipboard(apiKey, 'header-key')}
                style={{
                  padding: '0.4rem 0.75rem',
                  background: copied === 'header-key' ? '#10b981' : 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                {copied === 'header-key' ? <CheckCircle size={14} /> : <Copy size={14} />}
                {copied === 'header-key' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <code style={{ 
              fontSize: '0.8rem',
              fontFamily: 'monospace',
              color: '#222',
              wordBreak: 'break-all',
              display: 'block',
              padding: '0.5rem',
              background: '#f8f9fa',
              borderRadius: '4px'
            }}>{apiKey || 'No API key found'}</code>
          </div>

          {/* x-timestamp */}
          <div style={{ 
            padding: '0.75rem 1rem',
            borderBottom: '1px solid #e5e7eb',
          }}>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.5rem'
            }}>
              <code style={{ 
                minWidth: '120px',
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                color: '#667eea',
                fontWeight: 600
              }}>x-timestamp</code>
              <span style={{ fontSize: '0.85rem', color: '#666', flex: 1 }}>Current timestamp in milliseconds (required)</span>
              <button
                onClick={() => {
                  const ts = generateTimestamp();
                  copyToClipboard(ts, 'header-time');
                }}
                style={{
                  padding: '0.4rem 0.75rem',
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  marginRight: '0.5rem'
                }}
              >
                <ArrowClockwise size={14} />
                Generate
              </button>
              <button
                onClick={() => copyToClipboard(timestamp, 'header-time')}
                style={{
                  padding: '0.4rem 0.75rem',
                  background: copied === 'header-time' ? '#10b981' : 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
                disabled={!timestamp || !revealedTimestamp}
              >
                {copied === 'header-time' ? <CheckCircle size={14} /> : <Copy size={14} />}
                {copied === 'header-time' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <code style={{ 
              fontSize: '0.8rem',
              fontFamily: 'monospace',
              color: '#222',
              display: 'block',
              padding: '0.5rem',
              background: '#f8f9fa',
              borderRadius: '4px'
            }}>{timestamp || 'Click Generate to create timestamp'}</code>
          </div>

          {/* x-signature */}
          <div style={{ 
            padding: '0.75rem 1rem',
          }}>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.5rem'
            }}>
              <code style={{ 
                minWidth: '120px',
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                color: '#667eea',
                fontWeight: 600
              }}>x-signature</code>
              <span style={{ fontSize: '0.85rem', color: '#666', flex: 1 }}>SHA-256 hash signature (required)</span>
              <button
                onClick={async () => {
                  if (testBody && timestamp && apiKey) {
                    if (!validateJSON(testBody)) {
                      setJsonError('Invalid JSON format. Please fix the test body first.');
                      return;
                    }
                    const sig = await generateSignature(testBody, timestamp, apiKey);
                    if (sig) {
                      setSignature(sig);
                      setRevealedSignature(true);
                      copyToClipboard(sig, 'header-sig');
                    }
                  }
                }}
                style={{
                  padding: '0.4rem 0.75rem',
                  background: signatureLoading ? '#9ca3af' : 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (signatureLoading || !testBody || !timestamp || !apiKey) ? 'not-allowed' : 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  marginRight: '0.5rem',
                  opacity: (signatureLoading || !testBody || !timestamp || !apiKey) ? 0.6 : 1
                }}
                disabled={signatureLoading || !testBody || !timestamp || !apiKey || !!jsonError}
              >
                {signatureLoading ? (
                  <>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      border: '2px solid rgba(255,255,255,0.3)', 
                      borderTopColor: '#fff', 
                      borderRadius: '50%', 
                      animation: 'spin 0.8s linear infinite' 
                    }}></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <ArrowClockwise size={14} />
                    Generate
                  </>
                )}
              </button>
              <button
                onClick={() => copyToClipboard(signature, 'header-sig')}
                style={{
                  padding: '0.4rem 0.75rem',
                  background: copied === 'header-sig' ? '#10b981' : 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
                disabled={!signature || !revealedSignature}
              >
                {copied === 'header-sig' ? <CheckCircle size={14} /> : <Copy size={14} />}
                {copied === 'header-sig' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <code style={{ 
              fontSize: '0.8rem',
              fontFamily: 'monospace',
              color: signatureError ? '#dc2626' : (revealedSignature ? '#222' : '#9ca3af'),
              wordBreak: 'break-all',
              display: 'block',
              padding: '0.5rem',
              background: signatureError ? '#fef2f2' : (revealedSignature ? '#f8f9fa' : '#f3f4f6'),
              borderRadius: '4px',
              border: signatureError ? '1px solid #fecaca' : 'none',
              userSelect: revealedSignature ? 'text' : 'none'
            }}>
              {signatureError 
                ? `Error: ${signatureError}` 
                : revealedSignature && signature
                  ? signature 
                  : signature
                    ? '••••••••••••••••••••••••••••••••••••••••••••••••••••'
                    : 'Click Generate to create signature (requires valid JSON body, timestamp, and API key)'
              }
            </code>
            {signature && !signatureError && (
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem', margin: '0.5rem 0 0 0' }}>
                ✓ Generated from: SHA256(testBody + timestamp + apiKey)
              </p>
            )}
            {signatureError && (
              <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.5rem', margin: '0.5rem 0 0 0' }}>
                ⚠️ {signatureError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Signature Algorithm */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.75rem', 
          fontSize: '0.9rem', 
          fontWeight: 600, 
          color: '#374151' 
        }}>
          Signature Algorithm
        </label>
        <div style={{ 
          background: '#f8f9fa',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '1rem'
        }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>Algorithm</div>
            <code style={{ 
              fontSize: '0.9rem',
              fontFamily: 'monospace',
              color: '#222',
              fontWeight: 600
            }}>SHA-256</code>
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>Formula</div>
            <code style={{ 
              fontSize: '0.85rem',
              fontFamily: 'monospace',
              color: '#222',
              background: '#fff',
              padding: '0.5rem',
              borderRadius: '4px',
              display: 'block'
            }}>SHA256(body + timestamp + apiKey)</code>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#666', lineHeight: 1.6 }}>
            <strong>Steps:</strong>
            <ol style={{ margin: '0.5rem 0 0 1.5rem', padding: 0 }}>
              <li>Concatenate: JSON body string + timestamp (ms) + API key</li>
              <li>Compute SHA-256 hash of the concatenated string</li>
              <li>Send hash as hexadecimal string in <code style={{ background: '#fff', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>x-signature</code> header</li>
            </ol>
          </div>
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
        <strong>⚠️ Important:</strong> All POST requests require <code style={{ background: '#fff', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>x-api-key</code>, <code style={{ background: '#fff', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>x-signature</code>, and <code style={{ background: '#fff', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>x-timestamp</code> headers. 
        Signature must be SHA-256 hash of (body + timestamp + apiKey). Timestamp must be within 5 minutes of current time.
      </div>
    </div>
  );
};

export default WebhookIngestionUrl;
