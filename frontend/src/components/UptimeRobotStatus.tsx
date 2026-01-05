import React, { useEffect, useState } from 'react';

const UPTIME_API_KEY = 'PASTE_YOUR_UPTIMEROBOT_API_KEY_HERE'; // Use env variable in production
const MONITOR_ID = 'PASTE_YOUR_MONITOR_ID_HERE';

const UptimeRobotStatus: React.FC = () => {
  const [status, setStatus] = useState<string>('Loading...');

  useEffect(() => {
    // For demo: fetch from UptimeRobot API (public status page or proxy recommended for production)
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

  return (
    <div style={{ margin: '1rem 0', padding: '1rem', background: '#e0ffe5', borderRadius: 8 }}>
      <strong>UptimeRobot Status:</strong> {status}
    </div>
  );
};

export default UptimeRobotStatus;
