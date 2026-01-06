import React, { useEffect, useState } from 'react';
import apiConfig from '../config/api';
import { handleApiResponse, handleError } from '../utils/errorHandler';


const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const apiKey = localStorage.getItem('apiKey') || '';
    setLoading(true);
    setError('');
    
    fetch(apiConfig.endpoints.auditLogs, {
      headers: apiKey ? { 'x-api-key': apiKey } : {},
    })
      .then(res => handleApiResponse(res))
      .then((data: any) => setLogs(data.logs || data || []))
      .catch(e => handleError(e, setError))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2>Audit Logs</h2>
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '3px solid #e0e0e0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '0.5rem' }}></div>
          <div>Loading audit logs...</div>
        </div>
      )}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && !error && logs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#666' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No audit logs found.</p>
          <p style={{ fontSize: '0.9rem' }}>Audit logs will appear here as you use the system.</p>
        </div>
      )}
      {!loading && !error && logs.length > 0 && (
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
