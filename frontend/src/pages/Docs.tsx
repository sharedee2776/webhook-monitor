import React from 'react';
import { Link } from 'react-router-dom';
import { Book, Key, Plug, Bell, Users, ChartBar, Shield, ArrowRight } from '@phosphor-icons/react';

const Docs: React.FC = () => {
  const sections = [
    {
      icon: <Key size={24} />,
      title: 'Getting Started',
      content: [
        {
          heading: 'Creating Your Account',
          text: 'Sign up for a free account to get started. You\'ll receive a verification email - click the link to activate your account. Once verified, you can access your dashboard and start monitoring webhooks.'
        },
        {
          heading: 'Getting Your API Key',
          text: 'After signing up, navigate to the API Keys section in your dashboard. Generate a new API key and keep it secure - you\'ll need it to send webhooks to our platform.'
        },
        {
          heading: 'Your First Webhook',
          text: 'Send a POST request to your webhook endpoint with your API key in the x-api-key header. Your events will appear in the dashboard in real-time.'
        }
      ]
    },
    {
      icon: <Plug size={24} />,
      title: 'Sending Webhooks',
      content: [
        {
          heading: 'API Endpoint',
          text: 'Your webhook endpoint: https://webhook-monitor-func.azurewebsites.net/api/ingestWebhook'
        },
        {
          heading: 'Authentication',
          text: 'Include your API key in the x-api-key header. All requests must be signed with HMAC-SHA256 for security.'
        },
        {
          heading: 'Request Format',
          text: 'Send JSON data in the request body. Include a timestamp and signature for write operations. See our API documentation for detailed examples.'
        },
        {
          heading: 'Rate Limits',
          text: 'Free tier: 1,000 events/month. Pro: 100,000 events/month. Team: 1,000,000 events/month. Limits reset monthly.'
        }
      ]
    },
    {
      icon: <ChartBar size={24} />,
      title: 'Dashboard & Analytics',
      content: [
        {
          heading: 'Viewing Events',
          text: 'All incoming webhooks appear in your Events dashboard. Filter by status, type, or date range. Search for specific events using keywords.'
        },
        {
          heading: 'Usage Analytics',
          text: 'Monitor your API usage, event volume, and plan limits in the Usage Analytics section. Track trends over time with visual charts.'
        },
        {
          heading: 'Exporting Data',
          text: 'Export your webhook events as JSON or CSV for analysis. Use the Export Data feature to download historical data.'
        }
      ]
    },
    {
      icon: <Bell size={24} />,
      title: 'Alerts & Notifications',
      content: [
        {
          heading: 'Email Alerts',
          text: 'Configure email alerts for failed webhooks or when usage thresholds are exceeded. Set up alerts in the Alert Config section.'
        },
        {
          heading: 'Discord Integration',
          text: 'Connect your Discord server to receive real-time notifications. Configure webhook URLs in the Discord Integration section.'
        },
        {
          heading: 'Webhook Replay',
          text: 'If a webhook fails, you can replay it directly from the dashboard. Select the event and click "Replay" to resend.'
        }
      ]
    },
    {
      icon: <Users size={24} />,
      title: 'Team Management',
      content: [
        {
          heading: 'Adding Team Members',
          text: 'Invite team members in the Team Management section. Assign roles: Owner, Admin, Member, or Viewer. Each role has different permissions.'
        },
        {
          heading: 'Role Permissions',
          text: 'Owner: Full access. Admin: Manage settings and team. Member: View and manage events. Viewer: Read-only access.'
        },
        {
          heading: 'API Key Sharing',
          text: 'Share API keys securely with team members. Rotate keys regularly for security. Track key usage in the API Keys section.'
        }
      ]
    },
    {
      icon: <Shield size={24} />,
      title: 'Security & Best Practices',
      content: [
        {
          heading: 'API Key Security',
          text: 'Never expose API keys in client-side code. Store keys securely and rotate them regularly. Use environment variables in production.'
        },
        {
          heading: 'Request Signing',
          text: 'Always sign write requests with HMAC-SHA256. Include timestamp to prevent replay attacks. Validate signatures on your server.'
        },
        {
          heading: 'IP Whitelisting',
          text: 'Configure IP whitelisting for additional security. Only allow requests from trusted IP addresses.'
        },
        {
          heading: 'Audit Logs',
          text: 'All authentication attempts and security events are logged. Review audit logs regularly for suspicious activity.'
        }
      ]
    }
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '2rem auto', padding: '2rem 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '50%', marginBottom: '1rem' }}>
          <Book size={32} color="#fff" />
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#222' }}>Documentation & Help</h1>
        <p style={{ fontSize: '1.1rem', color: '#666', maxWidth: 600, margin: '0 auto' }}>
          Everything you need to know to get started with Webhook Monitor
        </p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: 'var(--primary)',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 600
          }}
        >
          <ArrowRight size={18} style={{ transform: 'rotate(180deg)' }} /> Back to Home
        </Link>
        <Link
          to="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: 'var(--surface)',
            color: 'var(--primary)',
            textDecoration: 'none',
            borderRadius: '8px',
            border: '2px solid var(--primary)',
            fontWeight: 600
          }}
        >
          Go to Dashboard <ArrowRight size={18} />
        </Link>
      </div>

      {sections.map((section, idx) => (
        <div key={idx} className="card" style={{ marginBottom: '2rem', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ color: 'var(--primary)' }}>{section.icon}</div>
            <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#222' }}>{section.title}</h2>
          </div>
          {section.content.map((item, itemIdx) => (
            <div key={itemIdx} style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#333' }}>{item.heading}</h3>
              <p style={{ color: '#666', lineHeight: 1.7, margin: 0 }}>{item.text}</p>
            </div>
          ))}
        </div>
      ))}

      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)', padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem', color: '#222' }}>Need More Help?</h2>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          Can't find what you're looking for? We're here to help!
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="mailto:damoladauda10@gmail.com"
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--primary)',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 600
            }}
          >
            Contact Support
          </a>
          <a
            href="https://github.com/sharedee2776/webhook-monitor"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--surface)',
              color: 'var(--primary)',
              textDecoration: 'none',
              borderRadius: '8px',
              border: '2px solid var(--primary)',
              fontWeight: 600
            }}
          >
            View on GitHub
          </a>
        </div>
      </div>
    </div>
  );
};

export default Docs;
