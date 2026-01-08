import React, { useState } from 'react';
import apiConfig from '../config/api';

const DiscordIntegration: React.FC = () => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    const apiKey = localStorage.getItem('apiKey') || '';
    if (!apiKey) {
      alert('API key is required. Please generate an API key first.');
      return;
    }
    try {
      const res = await fetch(apiConfig.endpoints.discordIntegration, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({ webhookUrl }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        const errorText = await res.text();
        if (res.status === 401) {
          alert('Authentication failed. Please check your API key.');
        } else {
          alert(`Failed to save webhook URL: ${errorText}`);
        }
      }
    } catch (err) {
      alert('Error saving webhook URL');
    }
  };

  return (
    <div style={{ margin: '2rem 0', padding: '1rem', background: '#e6e6ff', borderRadius: 8 }}>
      <h2>Discord Integration</h2>
      <form onSubmit={handleSave}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Discord Webhook URL: </label>
          <input
            type="url"
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            required
            style={{ width: '60%', padding: '0.5rem', marginLeft: '0.5rem' }}
            placeholder="https://discord.com/api/webhooks/..."
          />
        </div>
        <button type="submit">Save</button>
        {saved && <span style={{ color: 'green', marginLeft: '1rem' }}>Saved!</span>}
      </form>
      <p style={{ marginTop: '1rem', color: '#555' }}>
        Your Discord webhook URL will be securely stored and used only on the backend. Never expose it in the browser or frontend code.
      </p>
    </div>
  );
};

export default DiscordIntegration;
