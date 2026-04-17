import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { signIn, signUp } from '../services/api';

export default function AuthModal({ isOpen, onClose, defaultForm }) {
  const { login } = useAuth();
  const { toast } = useToast();

  // Controlled form state
  const [activeForm, setActiveForm] = useState(defaultForm || 'login');
  const [loginEmail,    setLoginEmail]    = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError,    setLoginError]    = useState('');
  const [loginLoading,  setLoginLoading]  = useState(false);

  const [regName,     setRegName]     = useState('');
  const [regEmail,    setRegEmail]    = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError,    setRegError]    = useState('');
  const [regLoading,  setRegLoading]  = useState(false);

  // Sync defaultForm prop → state
  useEffect(() => {
    if (isOpen) setActiveForm(defaultForm || 'login');
  }, [isOpen, defaultForm]);

  const switchForm = (form) => {
    setActiveForm(form);
    setLoginError('');
    setRegError('');
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setLoginError('Please fill in all fields.');
      return;
    }
    setLoginLoading(true);
    setLoginError('');
    try {
      const { data } = await signIn(loginEmail, loginPassword);
      const authToken = data.authorizationId || data.AuthorizationId;
      login(data, authToken);
      setLoginEmail('');
      setLoginPassword('');
      onClose();
      const name = data.PersonName || data.personName || loginEmail;
      toast(`Welcome back, ${name}!`, 'success');
    } catch (e) {
      const msg = e.response?.data?.title || e.response?.data?.message || e.message || 'Invalid credentials.';
      setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  // ── Register ──────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!regName || !regEmail || !regPassword) {
      setRegError('Please fill all details in all fields.');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }
    setRegLoading(true);
    setRegError('');
    try {
      await signUp(regName, regEmail, regPassword);
      // Pre-fill login email
      setLoginEmail(regEmail);
      setLoginPassword('');
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      switchForm('login');
      toast('Account created! Please sign in to continue.', 'success');
    } catch (e) {
      const msg = e.response?.data?.title || e.response?.data?.message || e.message || 'Registration failed.';
      setRegError(msg);
    } finally {
      setRegLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={`modal-overlay${isOpen ? ' open' : ''}`} onClick={handleOverlayClick}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* ── Login Form ── */}
        {activeForm === 'login' && (
          <div>
            <div className="modal-header">
              <h2>Welcome back</h2>
              <p>Sign in to save your history.</p>
            </div>
            {loginError && <div className="alert error">{loginError}</div>}
            <div className="field">
              <label className="field-label">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div className="field">
              <label className="field-label">Password</label>
              <input
                type="password"
                placeholder="Your password"
                autoComplete="current-password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <button
                className="btn btn-primary btn-full"
                onClick={handleLogin}
                disabled={loginLoading}
              >
                {loginLoading ? <><span className="spinner" /> Signing in…</> : 'Sign In'}
              </button>
            </div>
            <div className="modal-switch">
              No account?{' '}
              <a onClick={() => switchForm('register')}>Create one →</a>
            </div>
          </div>
        )}

        {/* ── Register Form ── */}
        {activeForm === 'register' && (
          <div>
            <div className="modal-header">
              <h2>Create account</h2>
              <p>Start saving your calculation history.</p>
            </div>
            {regError && <div className="alert error">{regError}</div>}
            <div className="field">
              <label className="field-label">Name</label>
              <input
                type="text"
                placeholder="Your name"
                autoComplete="name"
                value={regName}
                onChange={e => setRegName(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label">
                Password{' '}
                <span style={{ color: 'var(--text3)', fontSize: '11px' }}>(min 6 chars)</span>
              </label>
              <input
                type="password"
                placeholder="Create a password"
                autoComplete="new-password"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
              />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <button
                className="btn btn-primary btn-full"
                onClick={handleRegister}
                disabled={regLoading}
              >
                {regLoading ? <><span className="spinner" /> Creating account…</> : 'Create Account'}
              </button>
            </div>
            <div className="modal-switch">
              Already have an account?{' '}
              <a onClick={() => switchForm('login')}>Sign in →</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
