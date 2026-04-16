import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MobileNav({ isOpen, onClose, onOpenModal }) {
  const { isLoggedIn, displayName, initials, logout } = useAuth();
  const navigate = useNavigate();

  const go = (path) => { navigate(path); onClose(); };

  return (
    <>
      {/* Top bar */}
      <div className="mobile-topbar">
        <span className="mobile-topbar-brand">Quantity Measurement</span>
        <button className="hamburger" onClick={onClose}>
          <span /><span /><span />
        </button>
      </div>

      {/* Overlay nav */}
      <div className={`mobile-nav${isOpen ? ' open' : ''}`}>
        <button className="mobile-nav-close" onClick={onClose}>✕</button>

        {/* User info (if logged in) */}
        {isLoggedIn && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 20px', marginBottom: '8px',
            background: 'rgba(124,58,237,0.15)', borderRadius: '14px',
            border: '1px solid rgba(124,58,237,0.3)',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'linear-gradient(135deg,#7c3aed,#0ea5e9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#fff',
              flexShrink: 0,
            }}>{initials || '?'}</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{displayName}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '1px' }}>Signed in</div>
            </div>
          </div>
        )}

        <button className="nav-tab" onClick={() => go('/')}>
          <span className="nav-tab-icon">🏠</span> Home
        </button>
        <button className="nav-tab" onClick={() => go('/convert')}>
          <span className="nav-tab-icon">⇄</span> Convert
        </button>
        <button className="nav-tab" onClick={() => go('/arithmetic')}>
          <span className="nav-tab-icon">±</span> Arithmetic
        </button>
        <button className="nav-tab" onClick={() => go('/history')}>
          <span className="nav-tab-icon">🕘</span> History
        </button>

        <div className="mobile-divider" />

        {isLoggedIn ? (
          <button
            style={{
              width: '200px', padding: '11px 20px', borderRadius: '11px',
              border: '1.5px solid rgba(239,68,68,0.5)',
              background: 'rgba(239,68,68,0.12)',
              fontFamily: 'var(--sans)', fontSize: '13px', fontWeight: 700,
              color: '#ff6b6b', cursor: 'pointer',
            }}
            onClick={() => { logout(); onClose(); }}
          >
            Sign Out
          </button>
        ) : (
          <>
            <button
              style={{
                width: '200px', padding: '11px 20px', borderRadius: '11px',
                border: '1.5px solid rgba(124,58,237,0.4)',
                background: 'rgba(124,58,237,0.12)',
                fontFamily: 'var(--sans)', fontSize: '13px', fontWeight: 700,
                color: '#c4b5fd', cursor: 'pointer',
              }}
              onClick={() => { onOpenModal('login'); onClose(); }}
            >
              Sign In
            </button>
            <button
              className="btn btn-primary"
              style={{ width: '200px' }}
              onClick={() => { onOpenModal('register'); onClose(); }}
            >
              Register
            </button>
          </>
        )}
      </div>
    </>
  );
}
