import React from 'react';

const integrations = [
  { id: 1, name: 'Slack', description: 'Send webhook notifications to Slack channels.', connected: false },
  { id: 2, name: 'Discord', description: 'Send webhook notifications to Discord servers.', connected: true },
  { id: 3, name: 'Zapier', description: 'Automate workflows with Zapier integrations.', connected: false },
  { id: 4, name: 'Microsoft Teams', description: 'Send webhook notifications to Teams channels.', connected: false },
];

const IntegrationsMarketplace: React.FC = () => {
  return (
    <div style={{ margin: '2rem 0' }}>
      <h2>Integrations Marketplace</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        {integrations.map(integration => (
          <div key={integration.id} style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: '1.5rem', minWidth: 260, flex: '1 1 260px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <h3 style={{ margin: 0 }}>{integration.name}</h3>
            <p style={{ color: '#666', margin: '0.5rem 0 1rem 0' }}>{integration.description}</p>
            <button
              style={{
                padding: '0.5rem 1.5rem',
                background: integration.connected ? 'var(--success)' : 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 600
              }}
              disabled={integration.connected}
            >
              {integration.connected ? 'Connected' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntegrationsMarketplace;
