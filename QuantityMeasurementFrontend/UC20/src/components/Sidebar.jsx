import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ onOpenModal }) {
  const { isLoggedIn, displayName, initials, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const tabs = [
    { id: 'home',       label: 'Home',       icon: '🏠', path: '/' },
    { id: 'convert',    label: 'Convert',    icon: '⇄', path: '/convert' },
    { id: 'arithmetic', label: 'Arithmetic', icon: '±', path: '/arithmetic' },
    { id: 'history',    label: 'History',    icon: '🕘', path: '/history' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path;
  };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-logo">
          <div className="sidebar-brand-icon">⚖️</div>
          <div>
            <div className="sidebar-brand-title">Quantity<br />Measurement</div>
          </div>
        </div>
        <div className="sidebar-brand-sub">Unit · Arithmetic · History</div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-label">Operations</div>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab${isActive(tab.path) ? ' active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            <span className="nav-tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Auth footer */}
      <div className="sidebar-footer">
        {isLoggedIn ? (
          <>
            <div className="nav-user">
              <div className="nav-avatar">{initials}</div>
              <span style={{ fontSize: '12px' }}>{displayName}</span>
            </div>
            <button className="btn-ghost" onClick={logout}>Sign out</button>
          </>
        ) : (
          <div className="sidebar-auth-btns">
            <button
              className="btn btn-primary btn-full"
              style={{ fontSize: '13px', padding: '9px 14px' }}
              onClick={() => onOpenModal('register')}
            >
              Register
            </button>
            <button className="btn-ghost" onClick={() => onOpenModal('login')}>
              Sign In
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
