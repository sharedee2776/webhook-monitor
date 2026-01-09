
import React, { useState, useEffect } from 'react';
import apiConfig from '../config/api';
import SkeletonTable from '../components/SkeletonTable';
import { CheckCircle, WarningCircle, ListChecks, Copy, Eye, X, Clock, Tag, Link as LinkIcon } from '@phosphor-icons/react';
import { handleApiResponse, handleError } from '../utils/errorHandler';

const EventList: React.FC = () => {
  const [filter, setFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError('');
      try {
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
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = (status || 'pending').toLowerCase();
    if (statusLower === 'success') {
      return (
        <span className="badge success" style={{display:'inline-flex',alignItems:'center',gap:4}}>
          <CheckCircle size={16}/> Success
        </span>
      );
    } else if (statusLower === 'failed') {
      return (
        <span className="badge error" style={{display:'inline-flex',alignItems:'center',gap:4}}>
          <WarningCircle size={16}/> Failed
        </span>
      );
    } else {
      return (
        <span className="badge" style={{display:'inline-flex',alignItems:'center',gap:4, background: '#f3f4f6', color: '#6b7280'}}>
          <Clock size={16}/> Pending
        </span>
      );
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
    });
  };

  const filteredEvents = events.filter(e => {
    const matchesStatus = !filter || (e.status || 'pending').toLowerCase() === filter.toLowerCase();
    const matchesType = !eventTypeFilter || (e.eventType || '').toLowerCase().includes(eventTypeFilter.toLowerCase());
    const matchesSearch = !searchQuery || 
      (e.eventId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.eventType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.endpointName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(e.payload || {}).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  // Get unique event types for filter
  const eventTypes = Array.from(new Set(events.map(e => e.eventType).filter(Boolean)));

  return (
    <div style={{ margin: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ListChecks size={24} /> Incoming Webhooks
        </h2>
        <div style={{ fontSize: '0.9rem', color: '#666' }}>
          {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
        </div>
      </div>

      {/* Filters and Search */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1.5rem', 
        flexWrap: 'wrap',
        padding: '1rem',
        background: '#f9fafb',
        borderRadius: 8
      }}>
        <input
          type="text"
          placeholder="Search events..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid #ddd',
            borderRadius: 6,
            flex: '1 1 200px',
            fontSize: '0.9rem'
          }}
        />
        <select 
          value={filter} 
          onChange={e => setFilter(e.target.value)}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid #ddd',
            borderRadius: 6,
            fontSize: '0.9rem'
          }}
        >
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
        {eventTypes.length > 0 && (
          <select 
            value={eventTypeFilter} 
            onChange={e => setEventTypeFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid #ddd',
              borderRadius: 6,
              fontSize: '0.9rem'
            }}
          >
            <option value="">All Event Types</option>
            {eventTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div style={{ 
          padding: '1rem', 
          background: '#ffebee', 
          color: '#d32f2f', 
          borderRadius: 8, 
          marginBottom: '1rem' 
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <SkeletonTable rows={5} />
      ) : filteredEvents.length === 0 ? (
        <div style={{ 
          background: '#f8f9fa', 
          borderRadius: 12, 
          padding: '3rem 2rem',
          border: '2px dashed #dee2e6',
          textAlign: 'center'
        }}>
          <ListChecks size={48} style={{ color: '#6c757d', marginBottom: '1rem' }} />
          <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#222', fontWeight: 600 }}>
            {searchQuery || filter || eventTypeFilter ? 'No matching events found' : 'No events yet'}
          </p>
          <p style={{ fontSize: '0.95rem', color: '#666', marginBottom: '1.5rem' }}>
            {searchQuery || filter || eventTypeFilter
              ? 'Try adjusting your filters or check back later for new events.'
              : 'Start sending webhooks to your endpoints to see events appear here in real-time!'
            }
          </p>
        </div>
      ) : (
        <div style={{ 
          background: '#fff', 
          borderRadius: 8, 
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                  Timestamp
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                  Event Type
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                  Source Endpoint
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                  Status
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event, idx) => (
                <tr 
                  key={event.eventId || event.id || idx} 
                  style={{ 
                    borderBottom: idx < filteredEvents.length - 1 ? '1px solid #e5e7eb' : 'none',
                    background: idx % 2 === 0 ? '#fff' : '#f9fafb'
                  }}
                >
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#666' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={14} style={{ color: '#9ca3af' }} />
                      {formatTimestamp(event.receivedAt || event.timestamp)}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Tag size={16} style={{ color: '#6b7280' }} />
                      <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {event.eventType || event.type || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
                    {event.endpointName ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <LinkIcon size={16} style={{ color: '#6b7280' }} />
                        <div>
                          <div style={{ fontWeight: 500 }}>{event.endpointName}</div>
                          {event.endpointUrl && (
                            <div style={{ fontSize: '0.75rem', color: '#666', fontFamily: 'monospace' }}>
                              {event.endpointUrl.length > 40 ? event.endpointUrl.substring(0, 40) + '...' : event.endpointUrl}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No endpoint</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {getStatusBadge(event.status)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setSelectedEvent(event)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: '#4f46e5',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                        title="View JSON payload"
                      >
                        <Eye size={14} /> View
                      </button>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(event.payload || {}, null, 2))}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: '#f3f4f6',
                          color: '#374151',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                        title="Copy JSON to clipboard"
                      >
                        <Copy size={14} /> Copy
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* JSON Payload Modal */}
      {selectedEvent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }} onClick={() => setSelectedEvent(null)}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: '1.5rem',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Event Payload</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: 4
                }}
              >
                <X size={24} />
              </button>
            </div>
            <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
              <div><strong>Event ID:</strong> {selectedEvent.eventId || selectedEvent.id}</div>
              <div><strong>Event Type:</strong> {selectedEvent.eventType || selectedEvent.type}</div>
              <div><strong>Timestamp:</strong> {formatTimestamp(selectedEvent.receivedAt || selectedEvent.timestamp)}</div>
              {selectedEvent.endpointName && (
                <div><strong>Endpoint:</strong> {selectedEvent.endpointName}</div>
              )}
              {selectedEvent.status && (
                <div><strong>Status:</strong> {selectedEvent.status}</div>
              )}
            </div>
            <div style={{ 
              background: '#f9fafb', 
              padding: '1rem', 
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              position: 'relative'
            }}>
              <button
                onClick={() => copyToClipboard(JSON.stringify(selectedEvent.payload || {}, null, 2))}
                style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  padding: '0.5rem',
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.85rem'
                }}
              >
                <Copy size={16} /> Copy JSON
              </button>
              <pre style={{ 
                margin: 0, 
                fontSize: '0.85rem',
                overflow: 'auto',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {JSON.stringify(selectedEvent.payload || {}, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventList;
