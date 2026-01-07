import React from 'react';
import apiConfig from '../config/api';
import UsageAnalyticsChart from '../components/UsageAnalyticsChart';
import IntegrationsMarketplace from '../components/IntegrationsMarketplace';
import ExportData from '../components/ExportData';
import RoleAccessControl from '../components/RoleAccessControl';
import NotificationCenter from '../components/NotificationCenter';
import WebhookEndpoints from '../components/WebhookEndpoints';
import EventSearchFilter from '../components/EventSearchFilter';

import EventList from './EventList';
import UsageAnalytics from './UsageAnalytics';
import WebhookReplay from './WebhookReplay';
import TeamManagement from './TeamManagement';
import ApiKeyManagement from './ApiKeyManagement';
import AlertConfig from './AlertConfig';
import DiscordIntegration from './DiscordIntegration';
import { ChartBar, Key, Bell, Users, DiscordLogo, MagnifyingGlass, ArrowClockwise, ListChecks, LockKey, Info } from '@phosphor-icons/react';
import AuditLogs from '../components/AuditLogs';
import UptimeRobotStatus from '../components/UptimeRobotStatus';
import { auth } from '../firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';

const Dashboard: React.FC = () => {
  const [loadingPlan, setLoadingPlan] = React.useState(true);
  const [planError, setPlanError] = React.useState('');
  const [user, setUser] = React.useState<User | null>(null);
  const [tenantId, setTenantId] = React.useState<string>('');

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Use Firebase UID as tenant ID, or get from localStorage as fallback
        const storedTenantId = localStorage.getItem('tenantId') || firebaseUser.uid;
        setTenantId(storedTenantId);
        // Store it for future use
        if (!localStorage.getItem('tenantId')) {
          localStorage.setItem('tenantId', storedTenantId);
        }
      } else {
        setTenantId('');
        setLoadingPlan(false);
        setPlanError('Please sign in to view your plan.');
      }
    });
    return () => unsubscribe();
  }, []);

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
  return (
    <div style={{ maxWidth: 1100, margin: '3rem auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <UptimeRobotStatus />
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
      <div className="dashboard-grid">
        <div className="card"><ListChecks size={22} style={{marginRight:8,verticalAlign:'middle'}}/> <span style={{fontWeight:600}}>Events</span><EventList /></div>
        <div className="card"><ChartBar size={22} style={{marginRight:8,verticalAlign:'middle'}}/> <span style={{fontWeight:600}}>Usage Analytics</span><UsageAnalytics /></div>
        <div className="card"><ArrowClockwise size={22} style={{marginRight:8,verticalAlign:'middle'}}/> <span style={{fontWeight:600}}>Webhook Replay</span><WebhookReplay /></div>
        <div className="card"><Users size={22} style={{marginRight:8,verticalAlign:'middle'}}/> <span style={{fontWeight:600}}>Team Management</span><TeamManagement /></div>
        <div className="card"><Key size={22} style={{marginRight:8,verticalAlign:'middle'}}/> <span style={{fontWeight:600}}>API Keys</span><ApiKeyManagement /></div>
        <div className="card"><Bell size={22} style={{marginRight:8,verticalAlign:'middle'}}/> <span style={{fontWeight:600}}>Alert Config</span><AlertConfig /></div>
        <div className="card"><DiscordLogo size={22} style={{marginRight:8,verticalAlign:'middle'}}/> <span style={{fontWeight:600}}>Discord Integration</span><DiscordIntegration /></div>
      </div>
      <div className="card">
        <h2 style={{display:'flex',alignItems:'center',gap:8}}><Info size={22}/> Product Overview</h2>
        <ul style={{ textAlign: 'left', maxWidth: 600, margin: '1rem auto', fontSize:'1.08rem', lineHeight:1.7 }}>
          <li><ListChecks size={18} style={{marginRight:6,verticalAlign:'middle'}}/> <strong>Event Tracking:</strong> Instantly view incoming webhook events from all your integrations.</li>
          <li><ChartBar size={18} style={{marginRight:6,verticalAlign:'middle'}}/> <strong>Usage Analytics:</strong> Monitor your API usage, event volume, and plan limits.</li>
          <li><LockKey size={18} style={{marginRight:6,verticalAlign:'middle'}}/> <strong>Plan Management:</strong> Upgrade, downgrade, or view your current subscription plan.</li>
          <li><Bell size={18} style={{marginRight:6,verticalAlign:'middle'}}/> <strong>Alerting:</strong> Set up alerts for failed or high-latency webhooks.</li>
          <li><Key size={18} style={{marginRight:6,verticalAlign:'middle'}}/> <strong>API Keys:</strong> Manage and rotate your API keys securely.</li>
        </ul>
      </div>

      <div className="card">
        <h2 style={{display:'flex',alignItems:'center',gap:8}}><Info size={22}/> Recent Activity</h2>
        <AuditLogs />
      </div>
      <div className="card">
        <h2 style={{display:'flex',alignItems:'center',gap:8}}><MagnifyingGlass size={22}/> Recommended Features</h2>
        <ul style={{ textAlign: 'left', maxWidth: 600, margin: '1rem auto', fontSize:'1.08rem', lineHeight:1.7 }}>
          <li><MagnifyingGlass size={18} style={{marginRight:6,verticalAlign:'middle'}}/> <strong>Event Search & Filtering:</strong> Quickly find events by status, type, or date.</li>
          <li><ArrowClockwise size={18} style={{marginRight:6,verticalAlign:'middle'}}/> <strong>Webhook Replay:</strong> Re-send failed events to your endpoints.</li>
          <li><Users size={18} style={{marginRight:6,verticalAlign:'middle'}}/> <strong>Team Management:</strong> Invite and manage team members with role-based access.</li>
          <li><ListChecks size={18} style={{marginRight:6,verticalAlign:'middle'}}/> <strong>Audit Logs:</strong> Track changes and access for compliance and security.</li>
          <li><DiscordLogo size={18} style={{marginRight:6,verticalAlign:'middle'}}/> <strong>Integrations:</strong> Connect with popular services (Slack, Discord, Zapier, etc.).</li>
        </ul>
      </div>
      <div className="card">
        <EventSearchFilter />
      </div>
      <div className="card">
        <WebhookEndpoints />
      </div>
      <div className="card">
        <NotificationCenter />
      </div>
      <div className="card">
        <RoleAccessControl />
      </div>
      <div className="card">
        <ExportData />
      </div>
      <div className="card">
        <IntegrationsMarketplace />
      </div>
      <div className="card">
        <UsageAnalyticsChart />
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
