import React, { useEffect } from 'react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  let bg = '#2d6cdf';
  if (type === 'success') bg = '#4caf50';
  if (type === 'error') bg = '#e53935';

  return (
    <div style={{
      position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
      background: bg, color: '#fff', padding: '1rem 2rem', borderRadius: 12,
      boxShadow: '0 4px 24px rgba(45,108,223,0.13)', fontWeight: 600, fontSize: '1.1rem',
      minWidth: 220, textAlign: 'center',
    }}>
      {message}
    </div>
  );
};

export default Toast;
