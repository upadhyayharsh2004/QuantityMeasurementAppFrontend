import React from 'react';
import { UNITS } from '../services/units';
import { useArithmetic } from '../hooks/useArithmetic';
import ResultBox from '../components/ResultBox';

export default function ArithmeticPage() {
  const {
    arithOp, measType,
    aValue, aUnit,
    bValue, bUnit,
    targetUnit, result, loading,
    setArithOp, setMeasType,
    setAValue, setAUnit,
    setBValue, setBUnit,
    setTargetUnit,
    handleCalculate,
  } = useArithmetic();

  const ops   = [
    { id: 'addition',    label: 'Add',      icon: '➕' },
    { id: 'subtraction', label: 'Subtract', icon: '➖' },
    { id: 'division',    label: 'Divide',   icon: '➗' },
    { id: 'comparison',  label: 'Compare',  icon: '⚖️' },
  ];
  const types = [
    { id: 'length',      label: 'Length',      icon: '📏' },
    { id: 'weight',      label: 'Weight',      icon: '⚖️' },
    { id: 'volume',      label: 'Volume',      icon: '🧪' },
    { id: 'temperature', label: 'Temp',        icon: '🌡️' },
  ];
  const showTarget = arithOp !== 'division' && arithOp !== 'comparison';

  return (
    <div>
      <div className="section-head">
        <h2>Arithmetic Operations</h2>
        <p>Add, subtract, divide or compare two quantities.</p>
      </div>

      <div className="card">
        {/* Operation sub-tabs */}
        <div className="card-title">Operation</div>
        <div className="sub-tabs">
          {ops.map(op => (
            <button
              key={op.id}
              className={`sub-tab${arithOp === op.id ? ' active' : ''}`}
              onClick={() => setArithOp(op.id)}
            >
              <span>{op.icon}</span>
              {op.label}
            </button>
          ))}
        </div>

        {/* Quantity A */}
        <div className="field">
          <label className="field-label">Quantity A</label>
          <div className="row">
            <input
              type="number"
              placeholder="Value"
              step="any"
              value={aValue}
              onChange={e => setAValue(e.target.value)}
            />
            <select
              style={{ flex: '0 0 160px' }}
              value={aUnit}
              onChange={e => setAUnit(e.target.value)}
            >
              {UNITS[measType].map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          {/* Measurement type selector under A */}
          <div style={{ marginTop: '8px' }}>
            <select value={measType} onChange={e => setMeasType(e.target.value)}>
              {types.map(t => (
                <option key={t.id} value={t.id}>
                  {t.icon} {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quantity B */}
        <div className="field">
          <label className="field-label">Quantity B</label>
          <div className="row">
            <input
              type="number"
              placeholder="Value"
              step="any"
              value={bValue}
              onChange={e => setBValue(e.target.value)}
            />
            <select
              style={{ flex: '0 0 160px' }}
              value={bUnit}
              onChange={e => setBUnit(e.target.value)}
            >
              {UNITS[measType].map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Target unit (hidden for division/comparison) */}
        {showTarget && (
          <div className="field">
            <label className="field-label">Target unit</label>
            <select value={targetUnit} onChange={e => setTargetUnit(e.target.value)}>
              {UNITS[measType].map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        )}

        {/* Calculate button */}
        <button
          className="btn btn-primary btn-full"
          onClick={handleCalculate}
          disabled={loading}
        >
          {loading ? <><span className="spinner" /> Calculating…</> : 'Calculate'}
        </button>

        {/* Result */}
        <ResultBox result={result} />
      </div>
    </div>
  );
}
