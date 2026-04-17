import React from 'react';
import { UNITS } from '../services/units';
import { useConvert } from '../hooks/useConvert';
import ResultBox from '../components/ResultBox';

export default function ConvertPage() {
  const {
    convType, value, fromUnit, toUnit, result, loading,
    setConvType, setValue, setFromUnit, setToUnit,
    handleSwap, handleConvert,
  } = useConvert();

  const types = [
    { id: 'length',      label: 'Length',      icon: '📏' },
    { id: 'weight',      label: 'Weight',      icon: '⚖️' },
    { id: 'volume',      label: 'Volume',      icon: '🧪' },
    { id: 'temperature', label: 'Temp',        icon: '🌡️' },
  ];

  return (
    <div>
      <div className="section-head">
        <h2>Unit Conversion</h2>
        <p>Convert values between units of the same type.</p>
      </div>

      <div className="card">
        {/* Measurement Type sub-tabs */}
        <div className="card-title">Measurement Type</div>
        <div className="sub-tabs">
          {types.map(t => (
            <button
              key={t.id}
              className={`sub-tab${convType === t.id ? ' active' : ''}`}
              onClick={() => setConvType(t.id)}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Value + From unit */}
        <div className="field">
          <label className="field-label">Value</label>
          <div className="row">
            <input
              type="number"
              placeholder="Enter value"
              step="any"
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConvert()}
            />
            <select
              style={{ flex: '0 0 180px' }}
              value={fromUnit}
              onChange={e => setFromUnit(e.target.value)}
            >
              {UNITS[convType].map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap button */}
        <div className="swap-wrap">
          <button className="swap-btn" title="Swap units" onClick={handleSwap}>⇅</button>
        </div>

        {/* To unit */}
        <div className="field">
          <label className="field-label">Convert to</label>
          <select value={toUnit} onChange={e => setToUnit(e.target.value)}>
            {UNITS[convType].map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        {/* Convert button */}
        <button
          className="btn btn-primary btn-full"
          onClick={handleConvert}
          disabled={loading}
        >
          {loading ? <><span className="spinner" /> Converting…</> : 'Convert'}
        </button>

        {/* Result */}
        <ResultBox result={result} />
      </div>
    </div>
  );
}
