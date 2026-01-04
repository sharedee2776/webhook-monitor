import React from 'react';

const sampleData = [
  { id: 1, type: 'payment_succeeded', status: 'Success', date: '2026-01-01', payload: '{...}' },
  { id: 2, type: 'user_signup', status: 'Failed', date: '2026-01-02', payload: '{...}' },
  { id: 3, type: 'invoice_sent', status: 'Success', date: '2026-01-03', payload: '{...}' },
];

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const ExportData: React.FC = () => {
  const handleExportCSV = () => {
    const header = Object.keys(sampleData[0]).join(',');
    const rows = sampleData.map(row => Object.values(row).join(','));
    const csv = [header, ...rows].join('\n');
    downloadFile('events.csv', csv, 'text/csv');
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(sampleData, null, 2);
    downloadFile('events.json', json, 'application/json');
  };

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2>Export Data</h2>
      <button onClick={handleExportCSV} style={{ marginRight: 12, padding: '0.5rem 1.5rem' }}>Export as CSV</button>
      <button onClick={handleExportJSON} style={{ padding: '0.5rem 1.5rem' }}>Export as JSON</button>
    </div>
  );
};

export default ExportData;
