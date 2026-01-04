import React from 'react';

const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <tbody>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i}>
        {Array.from({ length: 5 }).map((_, j) => (
          <td key={j}>
            <div style={{
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e3e8ee 50%, #f0f0f0 75%)',
              borderRadius: 6,
              height: 18,
              width: j === 4 ? 60 : 80,
              margin: '0.3rem 0',
              animation: 'skeleton-loading 1.2s infinite linear',
            }} />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

export default SkeletonTable;
