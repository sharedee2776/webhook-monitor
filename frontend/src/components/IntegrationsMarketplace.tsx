import React, { useState, useEffect } from 'react';
import apiConfig from '../config/api';
import { CheckCircle, X, Plug } from '@phosphor-icons/react';

type IntegrationType = 'slack' | 'discord' | 'zapier' | 'teams';

interface Integration {
  type: IntegrationType;
  name: string;
  description: string;
  connected: boolean;
  connectedAt?: string;
  comingSoon?: boolean;
}

const INTEGRATIONS: Integration[] = [
  { type: 'discord', name: 'Discord', description: 'Send webhook notifications to Discord servers.', connected: false, comingSoon: false },
  { type: 'slack', name: 'Slack', description: 'Send webhook notifications to Slack channels.', connected: false, comingSoon: true },
  { type: 'zapier', name: 'Zapier', description: 'Automate workflows with Zapier integrations.', connected: false, comingSoon: true },
  { type: 'teams', name: 'Microsoft Teams', description: 'Send webhook notifications to Teams channels.', connected: false, comingSoon: true },
];

const IntegrationsMarketplace: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<IntegrationType | null>(null);

  useEffect(() => {
    fetchIntegrations();
    
    // Check for OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const integrationType = urlParams.get('integration') as IntegrationType;
    const status = urlParams.get('status');
    
    if (integrationType && status === 'connected') {
      // Remove query params
      window.history.replaceState({}, '', window.location.pathname);
      // Refresh integrations
      setTimeout(() => {
        fetchIntegrations();
        alert(`${INTEGRATIONS.find(i => i.type === integrationType)?.name} connected successfully!`);
      }, 500);
    }
  }, []);

  const fetchIntegrations = async () => {
    try {
      const apiKey = localStorage.getItem('apiKey') || '';
      const res = await fetch(apiConfig.endpoints.integrations, {
        headers: apiKey ? { 'x-api-key': apiKey } : {},
      });

      if (res.ok) {
        const data = await res.json();
        const connectedTypes = new Set(data.integrations?.map((i: any) => i.type) || []);
        
        setIntegrations(INTEGRATIONS.map(integration => ({
          ...integration,
          connected: connectedTypes.has(integration.type),
          connectedAt: data.integrations?.find((i: any) => i.type === integration.type)?.connectedAt,
        })));
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (integrationType: IntegrationType) => {
    // Only allow Discord for now
    if (integrationType !== 'discord') {
      alert('This integration is coming soon!');
      return;
    }
    
    setConnecting(integrationType);
    try {
      const apiKey = localStorage.getItem('apiKey') || '';
      const oauthUrl = `${apiConfig.baseUrl}/api/integrations/${integrationType}/oauth`;
      
      // Open OAuth in popup window
      const width = 600;
      const height = 700;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      
      const popup = window.open(
        oauthUrl + (apiKey ? `?x-api-key=${encodeURIComponent(apiKey)}` : ''),
        'OAuth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );

      // Poll for popup closure or message
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setConnecting(null);
          // Refresh integrations after a short delay
          setTimeout(fetchIntegrations, 1000);
        }
      }, 500);

      // Listen for message from popup (if OAuth completes)
      const messageHandler = (event: MessageEvent) => {
        if (event.data.type === 'oauth-complete') {
          clearInterval(checkClosed);
          popup?.close();
          window.removeEventListener('message', messageHandler);
          setConnecting(null);
          fetchIntegrations();
        }
      };
      window.addEventListener('message', messageHandler);
    } catch (error) {
      console.error('Failed to initiate OAuth:', error);
      setConnecting(null);
      alert('Failed to connect. Please try again.');
    }
  };

  const handleDisconnect = async (integrationType: IntegrationType) => {
    if (!confirm(`Are you sure you want to disconnect ${INTEGRATIONS.find(i => i.type === integrationType)?.name}?`)) {
      return;
    }

    try {
      const apiKey = localStorage.getItem('apiKey') || '';
      const res = await fetch(`${apiConfig.baseUrl}/api/integrations/${integrationType}/disconnect`, {
        method: 'POST',
        headers: apiKey ? { 'x-api-key': apiKey } : {},
      });

      if (res.ok) {
        fetchIntegrations();
        alert('Integration disconnected successfully');
      } else {
        alert('Failed to disconnect integration');
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
      alert('Failed to disconnect integration');
    }
  };

  if (loading) {
    return (
      <div style={{ margin: '2rem 0', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid #e0e0e0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
        <span style={{ marginLeft: '0.5rem' }}>Loading integrations...</span>
      </div>
    );
  }

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Plug size={24} /> Integrations Marketplace
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        {integrations.map(integration => (
          <div 
            key={integration.type} 
            style={{ 
              background: '#fff', 
              borderRadius: 8, 
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)', 
              padding: '1.5rem', 
              minWidth: 260, 
              flex: '1 1 260px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'flex-start',
              border: integration.connected ? '2px solid #10b981' : '1px solid #e5e7eb'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, flex: 1 }}>{integration.name}</h3>
              {integration.connected && (
                <CheckCircle size={20} color="#10b981" weight="fill" />
              )}
            </div>
            <p style={{ color: '#666', margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
              {integration.description}
            </p>
            {integration.connected && integration.connectedAt && (
              <p style={{ color: '#10b981', fontSize: '0.8rem', margin: '0 0 1rem 0' }}>
                Connected {new Date(integration.connectedAt).toLocaleDateString()}
              </p>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
              {integration.comingSoon ? (
                <button
                  disabled
                  style={{
                    padding: '0.5rem 1.5rem',
                    background: '#e5e7eb',
                    color: '#6b7280',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'not-allowed',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    flex: 1,
                    opacity: 0.7
                  }}
                >
                  Coming Soon
                </button>
              ) : integration.connected ? (
                <button
                  onClick={() => handleDisconnect(integration.type)}
                  style={{
                    padding: '0.5rem 1.5rem',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flex: 1,
                    justifyContent: 'center'
                  }}
                >
                  <X size={16} /> Disconnect
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(integration.type)}
                  disabled={connecting === integration.type}
                  style={{
                    padding: '0.5rem 1.5rem',
                    background: connecting === integration.type ? '#9ca3af' : 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: connecting === integration.type ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    flex: 1,
                    opacity: connecting === integration.type ? 0.7 : 1
                  }}
                >
                  {connecting === integration.type ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntegrationsMarketplace;
