import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MobileNav({ isOpen, onClose, onOpenModal }) {
  const { isLoggedIn, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const go = (path) => {
    navigate(path);
    onClose();
  };

  const handleAuth = (type) => {
    if (isLoggedIn) {
      logout();
    } else {
      onOpenModal(type);
    }
    onClose();
  };

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
          <button className="btn btn-secondary" style={{ width: '160px' }} onClick={() => { logout(); onClose(); }}>
            Sign out
          </button>
        ) : (
          <>
            <button className="btn btn-secondary" style={{ width: '160px' }} onClick={() => handleAuth('login')}>
              Sign In
            </button>
            <button className="btn btn-primary" style={{ width: '160px' }} onClick={() => handleAuth('register')}>
              Register
            </button>
          </>
        )}
      </div>
    </>
  );
}
