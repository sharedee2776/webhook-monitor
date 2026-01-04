import React, { useState } from 'react';

const initialNotifications = [
  { id: 1, type: 'error', message: 'Webhook delivery failed for user_signup', date: '2026-01-04 10:15' },
  { id: 2, type: 'info', message: 'API key rotated successfully', date: '2026-01-03 14:00' },
  { id: 3, type: 'warning', message: 'You are nearing your plan limit', date: '2026-01-02 09:30' },
];

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState(initialNotifications);

  const clearAll = () => setNotifications([]);
  const removeNotification = (id: number) => setNotifications(notifications.filter(n => n.id !== id));

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2>Notification Center</h2>
      <button onClick={clearAll} style={{ marginBottom: 12, padding: '0.4rem 1rem', background: 'var(--error)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Clear All</button>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {notifications.length === 0 && <li style={{ color: '#888' }}>No notifications</li>}
        {notifications.map(n => (
          <li key={n.id} style={{ background: '#f9f9f9', borderLeft: `4px solid ${n.type === 'error' ? 'red' : n.type === 'warning' ? 'orange' : 'blue'}`, marginBottom: 10, padding: '0.75rem 1rem', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ textTransform: 'capitalize', marginRight: 8 }}>{n.type}:</strong>
              {n.message}
              <span style={{ color: '#aaa', marginLeft: 12, fontSize: '0.95em' }}>{n.date}</span>
            </div>
            <button onClick={() => removeNotification(n.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>Dismiss</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationCenter;
