import React, { useState } from 'react';

const DiscordIntegration: React.FC = () => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    try {
      const res = await fetch('/api/discord/integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Optionally add auth headers here
        },
        body: JSON.stringify({ webhookUrl }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        alert('Failed to save webhook URL');
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
