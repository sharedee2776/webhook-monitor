import React, { useEffect, useState } from 'react';
import apiConfig from '../config/api';


const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(apiConfig.endpoints.auditLogs)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch audit logs');
        return res.json();
      })
      .then(setLogs)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2>Audit Logs</h2>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && !error && (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
          <thead style={{ background: '#f5f5f5' }}>
            <tr>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>User</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Action</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.75rem' }}>{log.date}</td>
                <td style={{ padding: '0.75rem' }}>{log.user}</td>
                <td style={{ padding: '0.75rem' }}>{log.action}</td>
                <td style={{ padding: '0.75rem' }}>{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AuditLogs;
