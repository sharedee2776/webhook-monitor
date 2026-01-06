import React, { useEffect, useState } from 'react';

const UPTIME_API_KEY = import.meta.env.VITE_UPTIMEROBOT_API_KEY || '';
const MONITOR_ID = import.meta.env.VITE_UPTIMEROBOT_MONITOR_ID || '';

const UptimeRobotStatus: React.FC = () => {
  const [status, setStatus] = useState<string>('Loading...');
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Only show if API key is configured
    if (!UPTIME_API_KEY || !MONITOR_ID || UPTIME_API_KEY === 'PASTE_YOUR_UPTIMEROBOT_API_KEY_HERE') {
      setEnabled(false);
      return;
    }

    setEnabled(true);
    
    // Fetch from UptimeRobot API
    fetch(`https://api.uptimerobot.com/v2/getMonitors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: UPTIME_API_KEY, monitors: MONITOR_ID, format: 'json' })
    })
      .then(res => res.json())
      .then(data => {
        if (data.monitors && data.monitors.length > 0) {
          const monitor = data.monitors[0];
          setStatus(monitor.status === 2 ? 'Online' : 'Offline');
        } else {
          setStatus('Unknown');
        }
      })
      .catch(() => setStatus('Error'));
  }, []);

  // Don't render if not configured
  if (!enabled) {
    return null;
  }

  return (
    <div style={{ margin: '1rem 0', padding: '1rem', background: '#e0ffe5', borderRadius: 8 }}>
      <strong>UptimeRobot Status:</strong> {status}
    </div>
  );
};

export default UptimeRobotStatus;
