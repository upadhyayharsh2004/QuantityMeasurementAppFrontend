import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage({ onOpenModal }) {
  const navigate    = useNavigate();
  const { isLoggedIn } = useAuth();

  const features = [
    {
      icon: '⇄',
      title: 'Unit Conversion',
      desc: 'Instantly convert between Length, Weight, Volume and Temperature units with precision.',
      path: '/convert',
    },
    {
      icon: '➕',
      title: 'Add Quantities',
      desc: 'Add two measurements together and get the result in any target unit you choose.',
      path: '/arithmetic',
    },
    {
      icon: '➗',
      title: 'Divide & Compare',
      desc: 'Divide quantities or compare them side-by-side to see which is greater or equal.',
      path: '/arithmetic',
    },
    {
      icon: '🕘',
      title: 'History Tracking',
      desc: 'Every calculation saved to your account. Filter by operation type anytime.',
      path: '/history',
    },
  ];

  const stats = [
    { icon: '📐', value: '4',    label: 'Measurement Types' },
    { icon: '🔢', value: '13+',  label: 'Supported Units' },
    { icon: '⚡', value: '5',    label: 'Operations' },
  ];

  const units = [
    { icon: '📏', name: 'Length',      units: 'Feet · Inch · Yard · cm' },
    { icon: '⚖️', name: 'Weight',      units: 'kg · Gram · Pound' },
    { icon: '🧪', name: 'Volume',      units: 'Litre · mL · Gallon' },
    { icon: '🌡️', name: 'Temperature', units: '°C · °F · Kelvin' },
  ];

  const steps = [
    { num: '1', title: 'Pick an operation', desc: 'Choose to convert, add, subtract, divide or compare measurements.' },
    { num: '2', title: 'Enter your values',  desc: 'Type in a value, choose your units and measurement type.' },
    { num: '3', title: 'Get instant results', desc: 'Hit calculate and see precise results. Sign in to save history.' },
  ];

  return (
    <div className="home-page">

      {/* ── Hero ── */}
      <div className="hero">
        <div className="hero-badge">
          <span className="badge-dot" />
          Quantity Measurement App
        </div>

        <h1 className="hero-title">
          Measure, Convert &amp;<br />
          <span className="gradient-text">Calculate Anything</span>
        </h1>

        <p className="hero-sub">
          A precision tool for unit conversion and arithmetic operations
          on physical quantities — fast, accurate, and beautifully simple.
        </p>

        <div className="hero-cta">
          <button className="btn btn-primary" onClick={() => navigate('/convert')}>
            Start Converting →
          </button>
          {!isLoggedIn && (
            <button className="btn btn-secondary" onClick={() => onOpenModal('register')}>
              Create Free Account
            </button>
          )}
          {isLoggedIn && (
            <button className="btn btn-secondary" onClick={() => navigate('/history')}>
              View My History
            </button>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="stats-row">
        {stats.map((s, i) => (
          <div className="stat-card" key={i}>
            <span className="stat-icon">{s.icon}</span>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Feature cards ── */}
      <div className="features-grid">
        {features.map((f, i) => (
          <div
            key={i}
            className="feature-card"
            onClick={() => navigate(f.path)}
          >
            <div className="fc-icon-wrap">{f.icon}</div>
            <div className="fc-title">{f.title}</div>
            <div className="fc-desc">{f.desc}</div>
            <span className="fc-arrow">↗</span>
          </div>
        ))}
      </div>

      {/* ── How it works ── */}
      <div className="how-section">
        <div className="how-section-title">How it works</div>
        <div className="steps-row">
          {steps.map((s, i) => (
            <div className="step" key={i}>
              <div className="step-num">{s.num}</div>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Units showcase ── */}
      <div className="units-showcase">
        <div className="units-showcase-title">Supported Measurement Types</div>
        {units.map((u, i) => (
          <div className="unit-pill" key={i} onClick={() => navigate('/convert')}>
            <div className="up-icon">{u.icon}</div>
            <div className="up-name">{u.name}</div>
            <div className="up-units">{u.units}</div>
          </div>
        ))}
      </div>

      {/* ── CTA Banner ── */}
      {!isLoggedIn && (
        <div className="cta-banner">
          <h3>Save Your Calculations</h3>
          <p>Create a free account to unlock history tracking and access your calculations anytime.</p>
          <div className="cta-btns">
            <button className="btn-white" onClick={() => onOpenModal('register')}>
              Create Free Account
            </button>
            <button className="btn-outline-white" onClick={() => onOpenModal('login')}>
              Sign In
            </button>
          </div>
        </div>
      )}

      {isLoggedIn && (
        <div className="cta-banner">
          <h3>Ready to Calculate?</h3>
          <p>Jump straight into conversions or arithmetic operations — your history is always saved.</p>
          <div className="cta-btns">
            <button className="btn-white" onClick={() => navigate('/convert')}>
              Convert Units
            </button>
            <button className="btn-outline-white" onClick={() => navigate('/arithmetic')}>
              Arithmetic
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
