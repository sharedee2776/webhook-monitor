import React, { useState } from 'react';

const WebhookReplay: React.FC = () => {
  // Dummy failed events
  const [failedEvents] = useState([
    { id: 2, type: 'user_signup', date: '2026-01-02', payload: '{...}' },
  ]);
  const [replayed, setReplayed] = useState<number[]>([]);

  const handleReplay = (id: number) => {
    setReplayed([...replayed, id]);
    // Here you would call your backend to replay the event
  };

  return (
    <div style={{ margin: '2rem 0', padding: '1rem', background: '#fffbe5', borderRadius: 8 }}>
      <h2>Webhook Replay</h2>
      {failedEvents.length === 0 ? (
        <p>No failed events to replay.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Date</th>
              <th>Replay</th>
            </tr>
          </thead>
          <tbody>
            {failedEvents.map(event => (
              <tr key={event.id}>
                <td>{event.id}</td>
                <td>{event.type}</td>
                <td>{event.date}</td>
                <td>
                  <button
                    onClick={() => handleReplay(event.id)}
                    disabled={replayed.includes(event.id)}
                  >
                    {replayed.includes(event.id) ? 'Replayed' : 'Replay'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default WebhookReplay;
