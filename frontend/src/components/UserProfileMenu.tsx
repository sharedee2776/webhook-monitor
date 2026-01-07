import React, { useState } from 'react';
import { CaretDown, SignOut } from '@phosphor-icons/react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

const UserProfileMenu: React.FC<{ userEmail?: string }> = ({ userEmail = 'user@webhook.com' }) => {
  const [open, setOpen] = useState(false);
  const initials = userEmail ? userEmail[0].toUpperCase() : 'U';
  const navigate = useNavigate();

  const handleLogout = async () => {
    setOpen(false);
    sessionStorage.removeItem('userSession');
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block', zIndex: 100 }}>
      <button
        className="btn"
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 1rem', borderRadius: '2rem', background: 'var(--surface)', color: 'var(--primary-dark)', boxShadow: '0 1px 4px rgba(45,108,223,0.07)', fontWeight: 600, fontSize: '1rem', border: '1px solid var(--border)' }}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' }}>{initials}</span>
        <span style={{ marginRight: 4 }}>{userEmail}</span>
        <CaretDown size={18} />
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1px solid var(--border)', borderRadius: '1rem', boxShadow: '0 4px 24px rgba(45,108,223,0.13)', minWidth: 180, padding: '0.5rem 0', marginTop: 4 }}>
          <button
            className="btn"
            style={{ width: '100%', background: 'none', color: 'var(--error)', border: 'none', borderRadius: 0, boxShadow: 'none', textAlign: 'left', padding: '0.75rem 1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={handleLogout}
          >
            <SignOut size={18} /> Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfileMenu;
