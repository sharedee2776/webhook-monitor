import React from 'react';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';

const UsageAnalytics: React.FC = () => {
  // Dummy data for demonstration
  const usage = {
    eventsThisMonth: 1200,
    planLimit: 5000,
    plan: 'Pro',
    renewal: '2026-02-01',
  };

  const percent = Math.round((usage.eventsThisMonth / usage.planLimit) * 100);
  let status: 'ok' | 'warning' | 'danger' = 'ok';
  if (percent > 90) status = 'danger';
  else if (percent > 70) status = 'warning';

  return (
    <div style={{ margin: '2rem 0', padding: '1rem', background: 'var(--bg)', borderRadius: 16, boxShadow: '0 1px 6px rgba(45,108,223,0.06)' }}>
      <h2 style={{display:'flex',alignItems:'center',gap:8}}>
        Usage Analytics & Plan Status
        {status === 'ok' && <span className="badge success" style={{marginLeft:8,display:'flex',alignItems:'center',gap:4}}><CheckCircle size={16}/> Healthy</span>}
        {status === 'warning' && <span className="badge warning" style={{marginLeft:8,display:'flex',alignItems:'center',gap:4}}><WarningCircle size={16}/> Near Limit</span>}
        {status === 'danger' && <span className="badge error" style={{marginLeft:8,display:'flex',alignItems:'center',gap:4}}><WarningCircle size={16}/> Limit!</span>}
      </h2>
      <p><strong>Current Plan:</strong> <span className="badge info">{usage.plan}</span></p>
      <p><strong>Events this month:</strong> {usage.eventsThisMonth} / {usage.planLimit}</p>
      <div style={{margin:'1rem 0',height:18,background:'#e3e8ee',borderRadius:10,overflow:'hidden',boxShadow:'0 1px 4px rgba(45,108,223,0.04)'}}>
        <div style={{width:`${percent}%`,height:'100%',background: status==='danger'?'#e53935':status==='warning'?'#ffb300':'#2d6cdf',transition:'width 0.5s',borderRadius:10}}></div>
      </div>
      <p><strong>Renewal Date:</strong> {usage.renewal}</p>
    </div>
  );
};

export default UsageAnalytics;
