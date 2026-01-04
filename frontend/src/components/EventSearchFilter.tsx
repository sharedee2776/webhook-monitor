import React, { useState } from 'react';

const sampleEvents = [
  { id: 1, type: 'payment_succeeded', status: 'Success', date: '2026-01-01', payload: '{...}' },
  { id: 2, type: 'user_signup', status: 'Failed', date: '2026-01-02', payload: '{...}' },
  { id: 3, type: 'invoice_sent', status: 'Success', date: '2026-01-03', payload: '{...}' },
  { id: 4, type: 'payment_failed', status: 'Failed', date: '2026-01-04', payload: '{...}' },
];

const statuses = ['All', 'Success', 'Failed'];

const EventSearchFilter: React.FC = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [date, setDate] = useState('');

  const filtered = sampleEvents.filter(event => {
    const matchesStatus = status === 'All' || event.status === status;
    const matchesSearch =
      event.type.toLowerCase().includes(search.toLowerCase()) ||
      event.id.toString().includes(search);
    const matchesDate = !date || event.date === date;
    return matchesStatus && matchesSearch && matchesDate;
  });

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2>Event Search & Filtering</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search by type or ID"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '0.5rem', flex: 1 }}
        />
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: '0.5rem' }}>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{ padding: '0.5rem' }}
        />
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
        <thead style={{ background: '#f5f5f5' }}>
          <tr>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>ID</th>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Type</th>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Payload</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(event => (
            <tr key={event.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.75rem' }}>{event.id}</td>
              <td style={{ padding: '0.75rem' }}>{event.type}</td>
              <td style={{ padding: '0.75rem' }}>{event.status}</td>
              <td style={{ padding: '0.75rem' }}>{event.date}</td>
              <td style={{ padding: '0.75rem' }}>{event.payload}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EventSearchFilter;
