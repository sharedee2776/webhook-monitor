import React from 'react';

// Simple bar chart using inline SVG for demonstration
const usageData = [
  { date: '2026-01-01', events: 120 },
  { date: '2026-01-02', events: 200 },
  { date: '2026-01-03', events: 350 },
  { date: '2026-01-04', events: 180 },
  { date: '2026-01-05', events: 400 },
  { date: '2026-01-06', events: 250 },
  { date: '2026-01-07', events: 300 },
];

const maxEvents = Math.max(...usageData.map(d => d.events));

const UsageAnalyticsChart: React.FC = () => {
  return (
    <div style={{ margin: '2rem 0' }}>
      <h2>API Usage Analytics</h2>
      <svg width={420} height={180} style={{ background: '#f9f9f9', borderRadius: 8, marginBottom: 16 }}>
        {usageData.map((d, i) => (
          <g key={d.date}>
            <rect
              x={i * 60 + 30}
              y={180 - (d.events / maxEvents) * 140 - 20}
              width={40}
              height={(d.events / maxEvents) * 140}
              fill="#2d6cdf"
              rx={6}
            />
            <text x={i * 60 + 50} y={170} textAnchor="middle" fontSize={12} fill="#888">{d.date.slice(5)}</text>
            <text x={i * 60 + 50} y={180 - (d.events / maxEvents) * 140 - 28} textAnchor="middle" fontSize={12} fill="#222">{d.events}</text>
          </g>
        ))}
      </svg>
      <div style={{ color: '#888', fontSize: 13 }}>Events per day (last 7 days)</div>
    </div>
  );
};

export default UsageAnalyticsChart;
