
import React, { useState, useEffect } from 'react';
import apiConfig from '../config/api';
import SkeletonTable from '../components/SkeletonTable';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { handleApiResponse, handleError } from '../utils/errorHandler';

const EventList: React.FC = () => {

  const [filter, setFilter] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError('');
      try {
        // Optionally get API key from localStorage or context
        const apiKey = localStorage.getItem('apiKey') || '';
        const res = await fetch(apiConfig.endpoints.dashboardEvents, {
          headers: apiKey ? { 'x-api-key': apiKey } : {},
        });
        const data: any = await handleApiResponse(res);
        setEvents(data.items || data || []);
      } catch (e: any) {
        handleError(e, setError);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(e =>
    (!filter || e.status === filter)
  );

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2>Webhook Events</h2>
      <div style={{ marginBottom: '1rem' }}>
        <label>Filter by status: </label>
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Status</th>
            <th>Date</th>
            <th>Payload</th>
          </tr>
        </thead>
        {loading ? (
          <SkeletonTable rows={3} />
        ) : filteredEvents.length === 0 ? (
          <tbody>
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#666' }}>
                <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No events yet.</p>
                <p style={{ fontSize: '0.9rem' }}>Start sending webhooks to see them here!</p>
              </td>
            </tr>
          </tbody>
        ) : (
          <tbody>
            {filteredEvents.map(event => (
              <tr key={event.id} style={{ background: 'var(--surface)' }}>
                <td>{event.id}</td>
                <td>{event.type}</td>
                <td>
                  {event.status === 'success' ? (
                    <span className="badge success" style={{display:'inline-flex',alignItems:'center',gap:4}}>
                      <CheckCircle size={16}/> Success
                    </span>
                  ) : (
                    <span className="badge error" style={{display:'inline-flex',alignItems:'center',gap:4}}>
                      <WarningCircle size={16}/> Failed
                    </span>
                  )}
                </td>
                <td>{event.date || event.timestamp}</td>
                <td><pre style={{ margin: 0 }}>{typeof event.payload === 'string' ? event.payload : JSON.stringify(event.payload, null, 2)}</pre></td>
              </tr>
            ))}
          </tbody>
        )}
      </table>
    </div>
  );
};

export default EventList;
