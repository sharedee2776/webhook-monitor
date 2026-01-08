import React from 'react';
import apiConfig from '../config/api';
import UsageAnalyticsChart from '../components/UsageAnalyticsChart';
import IntegrationsMarketplace from '../components/IntegrationsMarketplace';
import ExportData from '../components/ExportData';
import RoleAccessControl from '../components/RoleAccessControl';
import NotificationCenter from '../components/NotificationCenter';
import WebhookEndpoints from '../components/WebhookEndpoints';
import EventSearchFilter from '../components/EventSearchFilter';
import DashboardStats from '../components/DashboardStats';
import WebhookIngestionUrl from '../components/WebhookIngestionUrl';

import EventList from './EventList';
import UsageAnalytics from './UsageAnalytics';
import WebhookReplay from './WebhookReplay';
import TeamManagement from './TeamManagement';
import ApiKeyManagement from './ApiKeyManagement';
import AlertConfig from './AlertConfig';
import DiscordIntegration from './DiscordIntegration';
import { ChartBar, Key, Bell, Users, DiscordLogo, MagnifyingGlass, ArrowClockwise, ListChecks, LockKey, Info, Plus, Rocket, FileText, Plug } from '@phosphor-icons/react';
import AuditLogs from '../components/AuditLogs';
import UptimeRobotStatus from '../components/UptimeRobotStatus';
import { auth } from '../firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = React.useState(true);
  const [planError, setPlanError] = React.useState('');
  const [user, setUser] = React.useState<User | null>(null);
  const [tenantId, setTenantId] = React.useState<string>('');

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Check if email is verified
        if (!firebaseUser.emailVerified) {
          // Redirect to login with message
          navigate('/login?verify=required');
          return;
        }
        setUser(firebaseUser);
        // Use Firebase UID as tenant ID, or get from localStorage as fallback
        const storedTenantId = localStorage.getItem('tenantId') || firebaseUser.uid;
        setTenantId(storedTenantId);
        // Store it for future use
        if (!localStorage.getItem('tenantId')) {
          localStorage.setItem('tenantId', storedTenantId);
        }
      } else {
        setUser(null);
        setTenantId('');
        setLoadingPlan(false);
        setPlanError('Please sign in to view your plan.');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  React.useEffect(() => {
    if (!user || !tenantId) {
      return;
    }
    setLoadingPlan(true);
    setPlanError('');
    
    // Fetch plan - this will auto-create tenant if it doesn't exist
    fetch(`${apiConfig.endpoints.tenantPlan}?tenantId=${encodeURIComponent(tenantId)}`)
      .then(res => {
        if (!res.ok) {
          // If 404, try to initialize tenant
          if (res.status === 404) {
            return fetch(apiConfig.endpoints.initializeTenant, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tenantId, plan: 'free' })
            }).then(initRes => {
              if (initRes.ok) {
                return initRes.json().then(initData => {
                  // Store API key if returned
                  if (initData.apiKey) {
                    localStorage.setItem('apiKey', initData.apiKey);
                  }
                  // Retry fetching plan
                  return fetch(`${apiConfig.endpoints.tenantPlan}?tenantId=${encodeURIComponent(tenantId)}`)
                    .then(retryRes => retryRes.json());
                });
              }
              throw new Error('Failed to initialize tenant');
            });
          }
          throw new Error('Failed to fetch plan');
        }
        return res.json();
      })
      .then(() => {
        setPlanError('');
      })
      .catch((error) => {
        console.error('Plan fetch error:', error);
        setPlanError('Could not load plan details. Please try again later.');
      })
      .finally(() => setLoadingPlan(false));
  }, [user, tenantId]);
  const apiKey = localStorage.getItem('apiKey');
  const hasApiKey = !!apiKey;

  return (
    <div style={{ maxWidth: 1200, margin: '2rem auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <UptimeRobotStatus />
      
      {/* Key Metrics - What Matters in 5 Seconds */}
      {user && <DashboardStats />}

      {/* Clear CTAs - Quick Actions */}
      {user && (
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
          border: '1px solid #e0e7ff',
          padding: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#222', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Rocket size={24} /> Quick Actions
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem' 
          }}>
            {!hasApiKey && (
              <a 
                href="#api-keys" 
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('api-keys')?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem 1.5rem',
                  background: 'var(--primary)',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: '1rem',
                  boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(79, 70, 229, 0.3)';
                }}
              >
                <Key size={20} /> Get API Key
              </a>
            )}
            <a 
              href="#endpoints" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('endpoints')?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 1.5rem',
                background: hasApiKey ? 'var(--primary)' : '#e5e7eb',
                color: hasApiKey ? '#fff' : '#9ca3af',
                textDecoration: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '1rem',
                boxShadow: hasApiKey ? '0 2px 8px rgba(79, 70, 229, 0.3)' : 'none',
                cursor: hasApiKey ? 'pointer' : 'not-allowed',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                if (hasApiKey) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (hasApiKey) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(79, 70, 229, 0.3)';
                }
              }}
            >
              <Plus size={20} /> Create Endpoint
            </a>
            <a 
              href="/docs" 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 1.5rem',
                background: '#fff',
                color: 'var(--primary)',
                textDecoration: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '1rem',
                border: '2px solid var(--primary)',
                transition: 'background 0.2s, color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--primary)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.color = 'var(--primary)';
              }}
            >
              <FileText size={20} /> View Docs
            </a>
            <a 
              href="#events" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 1.5rem',
                background: '#fff',
                color: 'var(--primary)',
                textDecoration: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '1rem',
                border: '2px solid var(--primary)',
                transition: 'background 0.2s, color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--primary)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.color = 'var(--primary)';
              }}
            >
              <ListChecks size={20} /> View Events
            </a>
          </div>
          {!hasApiKey && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              background: '#fff3cd', 
              borderRadius: 6,
              fontSize: '0.9rem',
              color: '#856404'
            }}>
              <strong>Getting Started:</strong> Generate an API key to start monitoring webhooks. Then create an endpoint and start sending events!
            </div>
          )}
        </div>
      )}

      {/* Subscription Status */}
      <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(90deg, #f8fafc 60%, #e0e7ff 100%)', border: '1px solid #e0e7ff', boxShadow: '0 2px 8px rgba(100,108,255,0.07)' }}>
        <h2 style={{ fontSize: '1.7rem', marginBottom: 8, color: 'var(--primary)' }}><LockKey size={28} style={{verticalAlign:'middle',marginRight:8}}/> Subscription Status</h2>
        {!user && (
          <div style={{ padding: '1rem', color: '#666' }}>
            <p>Please <a href="/login" style={{ color: '#4f46e5', textDecoration: 'underline' }}>sign in</a> to view your subscription plan.</p>
          </div>
        )}
        {user && loadingPlan && (
          <div style={{ padding: '1rem', color: '#666' }}>
            <div style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #e0e0e0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
            <span style={{ marginLeft: '0.5rem' }}>Loading plan...</span>
          </div>
        )}
        {user && planError && (
          <div style={{ color: '#d32f2f', padding: '1rem', background: '#ffebee', borderRadius: 6, margin: '1rem 0' }}>
            {planError}
            {planError.includes('Could not load') && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                <p>Your tenant ID: <code style={{ background: '#fff', padding: '0.2rem 0.4rem', borderRadius: 4 }}>{tenantId}</code></p>
              </div>
            )}
          </div>
        )}
        {user && (
          <div style={{ margin: '1rem 0' }}>
            <a href="/checkout" style={{
              background: 'var(--primary)', color: '#fff', padding: '0.7rem 2rem', borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: '1.1rem', marginRight: 12
            }}>Upgrade/Downgrade Plan</a>
            <a href="/plan-details" style={{ color: '#4f46e5', textDecoration: 'underline', fontWeight: 500 }}>View Plan Details</a>
          </div>
        )}
      </div>
      {/* Core Features - Grouped by Functionality */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#222', marginBottom: '0.5rem' }}>Core Features</h2>
        
        {/* Webhook Ingestion URL - Permanent Section */}
        {user && hasApiKey && (
          <div>
            <h3 style={{display:'flex',alignItems:'center',gap:8, marginBottom: '1rem', fontSize: '1.2rem', color: '#222'}}>
              <Rocket size={22}/> <span style={{fontWeight:600}}>Send Webhooks</span>
            </h3>
            <WebhookIngestionUrl />
          </div>
        )}

        {/* Monitoring & Events Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <div className="card" id="events">
            <h3 style={{display:'flex',alignItems:'center',gap:8, marginBottom: '1rem'}}>
              <ListChecks size={22}/> <span style={{fontWeight:600}}>Events</span>
            </h3>
            <EventList />
          </div>
          <div className="card">
            <h3 style={{display:'flex',alignItems:'center',gap:8, marginBottom: '1rem'}}>
              <ChartBar size={22}/> <span style={{fontWeight:600}}>Usage Analytics</span>
            </h3>
            <UsageAnalytics />
          </div>
        </div>

        {/* Configuration Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <div className="card" id="api-keys">
            <h3 style={{display:'flex',alignItems:'center',gap:8, marginBottom: '1rem'}}>
              <Key size={22}/> <span style={{fontWeight:600}}>API Keys</span>
            </h3>
            <ApiKeyManagement />
          </div>
          <div className="card" id="endpoints">
            <h3 style={{display:'flex',alignItems:'center',gap:8, marginBottom: '1rem'}}>
              <Plug size={22}/> <span style={{fontWeight:600}}>Webhook Endpoints (Outgoing)</span>
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
              Configure endpoints where your webhook events should be forwarded to.
            </p>
            <WebhookEndpoints />
          </div>
        </div>

        {/* Alerts & Notifications Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <div className="card">
            <h3 style={{display:'flex',alignItems:'center',gap:8, marginBottom: '1rem'}}>
              <Bell size={22}/> <span style={{fontWeight:600}}>Alert Config</span>
            </h3>
            <AlertConfig />
          </div>
          <div className="card">
            <h3 style={{display:'flex',alignItems:'center',gap:8, marginBottom: '1rem'}}>
              <DiscordLogo size={22}/> <span style={{fontWeight:600}}>Discord Integration</span>
            </h3>
            <DiscordIntegration />
          </div>
        </div>

        {/* Tools & Actions Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <div className="card">
            <h3 style={{display:'flex',alignItems:'center',gap:8, marginBottom: '1rem'}}>
              <ArrowClockwise size={22}/> <span style={{fontWeight:600}}>Webhook Replay</span>
            </h3>
            <WebhookReplay />
          </div>
          <div className="card">
            <h3 style={{display:'flex',alignItems:'center',gap:8, marginBottom: '1rem'}}>
              <MagnifyingGlass size={22}/> <span style={{fontWeight:600}}>Event Search & Filter</span>
            </h3>
            <EventSearchFilter />
          </div>
        </div>
      </div>

      {/* Team & Collaboration Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#222', marginBottom: '0.5rem' }}>Team & Collaboration</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <div className="card">
            <h3 style={{display:'flex',alignItems:'center',gap:8, marginBottom: '1rem'}}>
              <Users size={22}/> <span style={{fontWeight:600}}>Team Management</span>
            </h3>
            <TeamManagement />
          </div>
          <div className="card">
            <h3 style={{display:'flex',alignItems:'center',gap:8, marginBottom: '1rem'}}>
              <LockKey size={22}/> <span style={{fontWeight:600}}>Role Access Control</span>
            </h3>
            <RoleAccessControl />
          </div>
        </div>
      </div>
      {/* Analytics & Reports Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#222', marginBottom: '0.5rem' }}>Analytics & Reports</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <div className="card">
            <h3 style={{display:'flex',alignItems:'center',gap:8, marginBottom: '1rem'}}>
              <ChartBar size={22}/> <span style={{fontWeight:600}}>Usage Chart</span>
            </h3>
            <UsageAnalyticsChart />
          </div>
          <div className="card">
            <h3 style={{display:'flex',alignItems:'center',gap:8, marginBottom: '1rem'}}>
              <Info size={22}/> <span style={{fontWeight:600}}>Export Data</span>
            </h3>
            <ExportData />
          </div>
        </div>
      </div>

      {/* Security & Audit Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#222', marginBottom: '0.5rem' }}>Security & Audit</h2>
        <div className="card">
          <h3 style={{display:'flex',alignItems:'center',gap:8, marginBottom: '1rem'}}>
            <Info size={22}/> <span style={{fontWeight:600}}>Recent Activity & Audit Logs</span>
          </h3>
          <AuditLogs />
        </div>
      </div>

      {/* Notifications & Integrations */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#222', marginBottom: '0.5rem' }}>Notifications & Integrations</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <div className="card">
            <h3 style={{display:'flex',alignItems:'center',gap:8, marginBottom: '1rem'}}>
              <Bell size={22}/> <span style={{fontWeight:600}}>Notification Center</span>
            </h3>
            <NotificationCenter />
          </div>
          <div className="card">
            <h3 style={{display:'flex',alignItems:'center',gap:8, marginBottom: '1rem'}}>
              <DiscordLogo size={22}/> <span style={{fontWeight:600}}>Integrations Marketplace</span>
            </h3>
            <IntegrationsMarketplace />
          </div>
        </div>
      </div>
      <div className="card">
        <h2>Documentation & Support</h2>
        <ul style={{ textAlign: 'left', maxWidth: 600, margin: '1rem auto', fontSize:'1.08rem', lineHeight:1.7 }}>
          <li><a href="https://github.com/sharedee2776/webhook-monitor/blob/main/docs" target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', textDecoration: 'underline' }}>Event Model Documentation</a></li>
          <li><a href="mailto:damoladauda10@gmail.com" style={{ color: '#4f46e5', textDecoration: 'underline' }}>Contact Support (Email)</a></li>
          <li>
            <a href="https://discord.gg/5MnFJ9bAKR" target="_blank" rel="noopener noreferrer" style={{ color: '#5865F2', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.369A19.791 19.791 0 0 0 16.885 3.2a.112.112 0 0 0-.119.056c-.524.96-.99 1.973-1.361 2.884a18.524 18.524 0 0 0-5.456 0A12.76 12.76 0 0 0 8.59 3.257a.115.115 0 0 0-.119-.057A19.736 19.736 0 0 0 3.683 4.369a.104.104 0 0 0-.047.041C.533 9.046-.32 13.58.099 18.057a.117.117 0 0 0 .045.082c2.053 1.507 4.042 2.422 5.993 3.029a.112.112 0 0 0 .123-.042c.462-.63.875-1.295 1.226-1.994a.112.112 0 0 0-.061-.155c-.652-.247-1.27-.548-1.872-.892a.112.112 0 0 1-.011-.186c.126-.094.252-.192.372-.291a.112.112 0 0 1 .114-.013c3.927 1.793 8.18 1.793 12.062 0a.112.112 0 0 1 .115.012c.12.099.246.197.372.291a.112.112 0 0 1-.01.186 12.298 12.298 0 0 1-1.873.892.112.112 0 0 0-.06.156c.36.698.773 1.362 1.225 1.993a.112.112 0 0 0 .123.043c1.95-.607 3.94-1.522 5.993-3.029a.115.115 0 0 0 .045-.082c.5-5.177-.838-9.673-3.549-13.647a.104.104 0 0 0-.047-.041ZM8.02 15.331c-1.183 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.156-2.418 1.21 0 2.174 1.095 2.156 2.418 0 1.334-.955 2.419-2.156 2.419Zm7.974 0c-1.183 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.156-2.418 1.21 0 2.174 1.095 2.156 2.418 0 1.334-.946 2.419-2.156 2.419Z" fill="#5865F2"/></svg>
              <span>Contact Support (Discord)</span>
            </a>
          </li>
          <li><a href="https://github.com/sharedee2776/webhook-monitor" target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', textDecoration: 'underline' }}>GitHub Repository</a></li>
          <li><a href="mailto:damoladauda10@gmail.com" style={{ color: '#4f46e5', textDecoration: 'underline' }}>Documentation & FAQ</a></li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
