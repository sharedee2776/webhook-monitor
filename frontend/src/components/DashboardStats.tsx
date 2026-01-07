import React, { useState, useEffect } from 'react';
import { CheckCircle, WarningCircle, ChartBar, Plug } from '@phosphor-icons/react';
import apiConfig from '../config/api';
import { handleApiResponse, handleError } from '../utils/errorHandler';

interface DashboardStats {
  totalWebhooks: number;
  successful: number;
  failed: number;
  eventsPerEndpoint: { endpoint: string; count: number }[];
  totalEndpoints: number;
}

const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalWebhooks: 0,
    successful: 0,
    failed: 0,
    eventsPerEndpoint: [],
    totalEndpoints: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const apiKey = localStorage.getItem('apiKey') || '';
        
        // Fetch events
        const eventsRes = await fetch(apiConfig.endpoints.dashboardEvents, {
          headers: apiKey ? { 'x-api-key': apiKey } : {},
        });
        const eventsData: any = await handleApiResponse(eventsRes);
        const events = eventsData.items || eventsData || [];

        // Fetch endpoints
        let endpoints: any[] = [];
        if (apiKey) {
          try {
            const endpointsRes = await fetch(apiConfig.endpoints.webhookEndpoints, {
              headers: { 'x-api-key': apiKey }
            });
            const endpointsData = await endpointsRes.json();
            endpoints = endpointsData.endpoints || [];
          } catch (e) {
            // Endpoints fetch failed, continue without it
          }
        }

        // Calculate stats
        const successful = events.filter((e: any) => e.status === 'success' || e.status === 'Success').length;
        const failed = events.filter((e: any) => e.status === 'failed' || e.status === 'Failed').length;
        const totalWebhooks = events.length;

        // Calculate events per endpoint (if endpoint info is in events)
        const endpointMap = new Map<string, number>();
        events.forEach((event: any) => {
          const endpoint = event.endpoint || event.endpointUrl || 'default';
          endpointMap.set(endpoint, (endpointMap.get(endpoint) || 0) + 1);
        });
        const eventsPerEndpoint = Array.from(endpointMap.entries())
          .map(([endpoint, count]) => ({ endpoint, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5); // Top 5 endpoints

        setStats({
          totalWebhooks,
          successful,
          failed,
          eventsPerEndpoint,
          totalEndpoints: endpoints.length
        });
      } catch (e: any) {
        handleError(e, setError);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ 
              display: 'inline-block', 
              width: '20px', 
              height: '20px', 
              border: '3px solid #e0e0e0', 
              borderTopColor: '#4f46e5', 
              borderRadius: '50%', 
              animation: 'spin 0.8s linear infinite' 
            }}></div>
          </div>
        ))}
      </div>
    );
  }

  const successRate = stats.totalWebhooks > 0 
    ? Math.round((stats.successful / stats.totalWebhooks) * 100) 
    : 0;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#222', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ChartBar size={24} /> Key Metrics
      </h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Total Webhooks */}
        <div className="card" style={{ 
          padding: '1.5rem', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <ChartBar size={28} />
            <div>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Total Webhooks</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>{stats.totalWebhooks.toLocaleString()}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '0.5rem' }}>
            {stats.totalEndpoints} {stats.totalEndpoints === 1 ? 'endpoint' : 'endpoints'} configured
          </div>
        </div>

        {/* Success Rate */}
        <div className="card" style={{ 
          padding: '1.5rem',
          background: successRate >= 95 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 
                      successRate >= 80 ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
                      'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: '#fff',
          boxShadow: successRate >= 95 ? '0 4px 12px rgba(16, 185, 129, 0.3)' :
                      successRate >= 80 ? '0 4px 12px rgba(245, 158, 11, 0.3)' :
                      '0 4px 12px rgba(239, 68, 68, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <CheckCircle size={28} />
            <div>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Success Rate</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>{successRate}%</div>
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '0.5rem' }}>
            {stats.successful.toLocaleString()} successful
          </div>
        </div>

        {/* Failures */}
        <div className="card" style={{ 
          padding: '1.5rem',
          background: stats.failed === 0 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                      'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: '#fff',
          boxShadow: stats.failed === 0 ? '0 4px 12px rgba(16, 185, 129, 0.3)' :
                      '0 4px 12px rgba(239, 68, 68, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <WarningCircle size={28} />
            <div>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Failed</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>{stats.failed.toLocaleString()}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '0.5rem' }}>
            {stats.failed === 0 ? 'All systems operational' : 'Needs attention'}
          </div>
        </div>

        {/* Active Endpoints */}
        <div className="card" style={{ 
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Plug size={28} />
            <div>
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Active Endpoints</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>{stats.totalEndpoints}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '0.5rem' }}>
            {stats.totalEndpoints === 0 ? 'Create your first endpoint' : 'Monitoring'}
          </div>
        </div>
      </div>

      {/* Events Per Endpoint */}
      {stats.eventsPerEndpoint.length > 0 && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#222', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ChartBar size={20} /> Events Per Endpoint (Top 5)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {stats.eventsPerEndpoint.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  flex: 1, 
                  background: '#f3f4f6', 
                  height: '8px', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min((item.count / stats.totalWebhooks) * 100, 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                    transition: 'width 0.3s'
                  }}></div>
                </div>
                <div style={{ 
                  minWidth: '120px', 
                  fontSize: '0.9rem', 
                  color: '#666',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}>
                  {item.endpoint.length > 20 ? `${item.endpoint.substring(0, 20)}...` : item.endpoint}
                </div>
                <div style={{ 
                  minWidth: '60px', 
                  textAlign: 'right', 
                  fontWeight: 600, 
                  color: '#222' 
                }}>
                  {item.count.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div style={{ 
          padding: '1rem', 
          background: '#ffebee', 
          color: '#d32f2f', 
          borderRadius: 8, 
          marginTop: '1rem' 
        }}>
          Error loading stats: {error}
        </div>
      )}
    </div>
  );
};

export default DashboardStats;
