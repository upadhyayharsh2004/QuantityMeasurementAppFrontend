import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ onOpenModal }) {
  const { isLoggedIn, displayName, initials, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
          <div className="sidebar-user-block">
            {/* User info card */}
            <div className="sidebar-user-card">
              <div className="sidebar-user-avatar">{initials || '?'}</div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{displayName}</div>
                <div className="sidebar-user-status">
                  <span className="status-dot" />
                  Signed in
                </div>
              </div>
            </div>
            {/* Sign out button */}
            <button className="sidebar-signout-btn" onClick={logout}>
              <span className="signout-icon">⏻</span>
              Sign Out
            </button>
          </div>
        ) : (
          <div className="sidebar-auth-btns">
            <button
              className="btn btn-primary btn-full"
              style={{ fontSize: '13px', padding: '10px 14px' }}
              onClick={() => onOpenModal('register')}
            >
              Register
            </button>
            <button
              className="sidebar-signin-btn"
              onClick={() => onOpenModal('login')}
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
