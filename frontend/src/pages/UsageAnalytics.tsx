import React, { useEffect, useState } from 'react';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';
import apiConfig from '../config/api';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { handleApiResponse, handleError } from '../utils/errorHandler';

interface UsageData {
  eventsThisMonth: number;
  planLimit: number;
  plan: string;
  renewal?: string;
}

const UsageAnalytics: React.FC = () => {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [tenantId, setTenantId] = useState<string>('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const storedTenantId = localStorage.getItem('tenantId') || firebaseUser.uid;
        setTenantId(storedTenantId);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !tenantId) {
      setLoading(false);
      return;
    }

    const fetchUsage = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch plan info
        const planRes = await fetch(`${apiConfig.endpoints.tenantPlan}?tenantId=${encodeURIComponent(tenantId)}`);
        const planData: any = await handleApiResponse(planRes);
        
        // Get plan limits based on plan type
        const planLimits: Record<string, number> = {
          free: 1000,
          pro: 100000,
          team: 1000000
        };
        
        const currentPlan = planData.plan || 'free';
        const planLimit = planLimits[currentPlan] || 1000;
        const eventsThisMonth = planData.usage || 0;

        setUsage({
          eventsThisMonth,
          planLimit,
          plan: currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1),
          renewal: planData.subscriptionExpiresAt ? new Date(planData.subscriptionExpiresAt).toLocaleDateString() : undefined
        });
      } catch (e: any) {
        handleError(e, setError);
        // Fallback to default values
        setUsage({
          eventsThisMonth: 0,
          planLimit: 1000,
          plan: 'Free'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, [user, tenantId]);

  if (loading) {
    return (
      <div style={{ margin: '2rem 0', padding: '1rem', textAlign: 'center', color: '#666' }}>
        <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '3px solid #e0e0e0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '0.5rem' }}></div>
        <div>Loading usage data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ margin: '2rem 0', padding: '1rem', color: '#d32f2f', background: '#ffebee', borderRadius: 8 }}>
        Error loading usage: {error}
      </div>
    );
  }

  if (!usage) {
    return (
      <div style={{ margin: '2rem 0', padding: '1rem', textAlign: 'center', color: '#666' }}>
        No usage data available.
      </div>
    );
  }

  const percent = Math.round((usage.eventsThisMonth / usage.planLimit) * 100);
  let status: 'ok' | 'warning' | 'danger' = 'ok';
  if (percent > 90) status = 'danger';
  else if (percent > 70) status = 'warning';

  return (
    <div style={{ margin: '2rem 0', padding: '1rem', background: 'var(--bg)', borderRadius: 16, boxShadow: '0 1px 6px rgba(45,108,223,0.06)' }}>
      <h2 style={{display:'flex',alignItems:'center',gap:8, flexWrap: 'wrap'}}>
        Usage Analytics & Plan Status
        {status === 'ok' && <span className="badge success" style={{marginLeft:8,display:'flex',alignItems:'center',gap:4}}><CheckCircle size={16}/> Healthy</span>}
        {status === 'warning' && <span className="badge warning" style={{marginLeft:8,display:'flex',alignItems:'center',gap:4}}><WarningCircle size={16}/> Near Limit</span>}
        {status === 'danger' && <span className="badge error" style={{marginLeft:8,display:'flex',alignItems:'center',gap:4}}><WarningCircle size={16}/> Limit!</span>}
      </h2>
      <p><strong>Current Plan:</strong> <span className="badge info">{usage.plan}</span></p>
      <p><strong>Events this month:</strong> {usage.eventsThisMonth.toLocaleString()} / {usage.planLimit.toLocaleString()}</p>
      <div style={{margin:'1rem 0',height:18,background:'#e3e8ee',borderRadius:10,overflow:'hidden',boxShadow:'0 1px 4px rgba(45,108,223,0.04)'}}>
        <div style={{width:`${Math.min(percent, 100)}%`,height:'100%',background: status==='danger'?'#e53935':status==='warning'?'#ffb300':'#2d6cdf',transition:'width 0.5s',borderRadius:10}}></div>
      </div>
      {usage.renewal && <p><strong>Renewal Date:</strong> {usage.renewal}</p>}
    </div>
  );
};

export default UsageAnalytics;
