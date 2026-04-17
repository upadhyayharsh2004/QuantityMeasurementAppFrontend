import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHistory } from '../hooks/useHistory';
import {
  extractOp, extractError, extractErrorMessage,
  extractResultValue, extractResultUnit, extractResultString,
  formatNum, opSymbol, capitalize,
} from '../services/units';

// ── Helpers ───────────────────────────────────────────────────────────────────

function pickField(item, ...keys) {
  for (const k of keys) {
    const v = item[k] ?? item[k.charAt(0).toLowerCase() + k.slice(1)];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return '';
}

function formatTimestamp(raw) {
  if (!raw) return { date: '—', time: '—', full: '—' };
  try {
    const d = new Date(raw);
    if (isNaN(d)) return { date: '—', time: '—', full: raw };
    const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    return { date, time, full: `${date} · ${time}` };
  } catch {
    return { date: '—', time: '—', full: raw };
  }
}

const OP_CONFIG = {
  addition:    { label: 'Addition',    icon: '+', cls: 'add', color: '#6d28d9' },
  subtraction: { label: 'Subtraction', icon: '−', cls: 'sub', color: '#0369a1' },
  division:    { label: 'Division',    icon: '÷', cls: 'div', color: '#b45309' },
  conversion:  { label: 'Conversion',  icon: '⇄', cls: 'conv', color: '#047857' },
  comparison:  { label: 'Comparison',  icon: '≈', cls: 'cmp', color: '#4338ca' },
};

// ── HistoryCard (rich version using all DB columns) ───────────────────────────
function HistoryCard({ item, idx }) {
  const op     = extractOp(item) || 'conversion';
  const isErr  = extractError(item);
  const cfg    = OP_CONFIG[op] || OP_CONFIG.conversion;

  // DB columns: entity_first_value, entity_second_unit (used as first unit),
  // entity_second_value, entity_second_unit,
  // entity_result_value, entity_measurement_type, entity_operation,
  // entity_created_at, entity_updated_at, entity_is_error, entity_error_message
  const firstVal   = pickField(item, 'entity_first_value',  'EntityFirstValue',  'ThisValueDTOs',  'thisValueDTOs',  'FirstValue',  'firstValue');
  const firstUnit  = pickField(item, 'entity_first_unit',   'EntityFirstUnit',   'ThisUnitDTOs',   'thisUnitDTOs',   'FirstUnit',   'firstUnit');
  const secondVal  = pickField(item, 'entity_second_value', 'EntitySecondValue', 'ThereValueDTOs', 'thereValueDTOs', 'SecondValue', 'secondValue');
  const secondUnit = pickField(item, 'entity_second_unit',  'EntitySecondUnit',  'ThereUnitDTOs',  'thereUnitDTOs',  'SecondUnit',  'secondUnit',
                               // For conversion, second unit = target unit
                               'TargetUnit', 'targetUnit', 'ResultUnit', 'resultUnit',
                               'ResultUnitDTOs', 'resultUnitDTOs');
  const measType   = pickField(item, 'entity_measurement_type', 'EntityMeasurementType', 'MeasurementTypeDTOs', 'measurementType', 'MeasurementType');
  const entityOp   = pickField(item, 'entity_operation', 'EntityOperation', 'OperationDTOs', 'operation', 'Operation');
  const createdAt  = pickField(item, 'entity_created_at', 'EntityCreatedAt', 'CreatedAt', 'createdAt', 'created_at');
  const updatedAt  = pickField(item, 'entity_updated_at', 'EntityUpdatedAt', 'UpdatedAt', 'updatedAt', 'updated_at');
  const isErrorDb  = pickField(item, 'entity_is_error', 'EntityIsError', 'IsError', 'isError');
  const errMsg     = extractErrorMessage(item);
  const resultVal  = extractResultValue(item);
  const resultUnit = extractResultUnit(item);
  const resultStr  = extractResultString(item);
  const entityId   = pickField(item, 'entity_id', 'EntityId', 'Id', 'id');

  const ts   = formatTimestamp(createdAt);
  const tsUp = formatTimestamp(updatedAt);

  const showSecond = op !== 'conversion' && (secondVal !== '' || secondUnit !== '');
  // For conversion: secondUnit = the target unit
  const convTargetUnit = op === 'conversion' ? (secondUnit || resultUnit) : '';

  return (
    <div className={`history-card${isErr ? ' err-card' : ''}`} style={{ animationDelay: `${idx * 0.03}s` }}>

      {/* ── Header ── */}
      <div className="hc-header">
        {/* Operation badge */}
        <span className={`hc-op-badge ${cfg.cls}`}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '13px' }}>{cfg.icon}</span>
          {cfg.label}
        </span>

        {/* Measurement type tag */}
        {measType && (() => {
          const typeIcons = { length: '📏', weight: '⚖️', volume: '🧪', temperature: '🌡️' };
          const icon = typeIcons[measType?.toLowerCase()] || '';
          return (
            <span className="hc-type-tag">
              {icon && <span style={{ marginRight: '4px' }}>{icon}</span>}
              {capitalize(measType)}
            </span>
          );
        })()}

        {/* Error badge */}
        {isErr && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '3px 10px', borderRadius: '12px',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            fontSize: '11px', fontWeight: 700, color: '#dc2626',
          }}>
            ⚠ Error
          </span>
        )}

        {/* ID pill */}
        {entityId !== '' && (
          <span style={{
            fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--text3)',
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '2px 8px', fontWeight: 600,
          }}>
            #{entityId}
          </span>
        )}

        {/* Timestamp */}
        <div className="hc-timestamp">
          <span className="hc-ts-date">{ts.date}</span>
          <span className="hc-ts-time">{ts.time}</span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="hc-body">

        {/* ── Flow visualisation ── */}
        {!isErr && (
          <div className="hc-flow">
            {/* First quantity */}
            {firstVal !== '' && (
              <div className="hc-qty">
                <span className="qty-value">{formatNum(Number(firstVal))}</span>
                <span className="qty-unit">{firstUnit || '—'}</span>
                <span className="qty-label">
                  {op === 'conversion' ? 'From' : 'Value A'}
                </span>
              </div>
            )}

            {/* Arrow / operator */}
            {firstVal !== '' && (
              <span className="hc-arrow">
                {op === 'conversion' ? '→' : opSymbol(op)}
              </span>
            )}

            {/* Second quantity (arithmetic) */}
            {showSecond && secondVal !== '' && (
              <>
                <div className="hc-qty">
                  <span className="qty-value">{formatNum(Number(secondVal))}</span>
                  <span className="qty-unit">{secondUnit || '—'}</span>
                  <span className="qty-label">Value B</span>
                </div>
                <span className="hc-arrow">=</span>
              </>
            )}

            {/* Conversion target unit indicator - only show if result exists */}
            {op === 'conversion' && convTargetUnit && firstVal !== '' && resultVal !== null && resultVal !== undefined && (
              <>
                <div className="hc-qty" style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.06),rgba(14,165,233,0.04))', borderColor: 'rgba(16,185,129,0.2)' }}>
                  <span className="qty-value" style={{ background: 'var(--grad3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{resultVal}</span>
                  <span className="qty-unit" style={{ color: '#047857' }}>{convTargetUnit}</span>
                  <span className="qty-label">To</span>
                </div>
                <span className="hc-arrow">=</span>
              </>
            )}

            {/* Result */}
            {op === 'comparison' && resultStr ? (
              <div className="hc-result-compare">
                <span className="cmp-verdict">{resultStr}</span>
                <span className="qty-label">Verdict</span>
              </div>
            ) : resultVal !== null && resultVal !== undefined ? (
              <div className={`hc-result-qty${isErr ? ' error' : ''}`}>
                <span className="qty-value">{formatNum(resultVal)}</span>
                <span className="qty-unit">{resultUnit || (op === 'comparison' ? '' : '—')}</span>
                <span className="qty-label">Result</span>
              </div>
            ) : null}
          </div>
        )}

        {/* ── Error banner ── */}
        {isErr && (
          <div className="hc-error-banner">
            <span className="err-icon">⚠️</span>
            <span>{errMsg || 'An error occurred during this operation.'}</span>
          </div>
        )}

        {/* ── Meta chips row ── */}
        <div className="hc-meta-row">
          {/* Operation type from DB */}
          {entityOp && (
            <span className="hc-meta-chip">
              <span className="chip-label">Operation</span>
              <span className="chip-val">{capitalize(entityOp)}</span>
            </span>
          )}

          {/* First value + unit */}
          {firstVal !== '' && (
            <span className="hc-meta-chip">
              <span className="chip-label">{op === 'conversion' ? 'From' : 'A'}</span>
              <span className="chip-val">{formatNum(Number(firstVal))} {firstUnit}</span>
            </span>
          )}

          {/* Second value + unit (if present) */}
          {secondVal !== '' && op !== 'conversion' && (
            <span className="hc-meta-chip">
              <span className="chip-label">B</span>
              <span className="chip-val">{formatNum(Number(secondVal))} {secondUnit}</span>
            </span>
          )}

          {/* For conversion: target unit */}
          {op === 'conversion' && convTargetUnit && (
            <span className="hc-meta-chip">
              <span className="chip-label">To Unit</span>
              <span className="chip-val">{convTargetUnit}</span>
            </span>
          )}

          {/* Result */}
          {!isErr && resultVal !== null && resultVal !== undefined && op !== 'comparison' && (
            <span className={`hc-meta-chip chip-success`}>
              <span className="chip-label">Result</span>
              <span className="chip-val">{formatNum(resultVal)} {resultUnit}</span>
            </span>
          )}

          {/* Comparison verdict */}
          {op === 'comparison' && resultStr && (
            <span className="hc-meta-chip chip-success">
              <span className="chip-label">Verdict</span>
              <span className="chip-val">{resultStr}</span>
            </span>
          )}

          {/* Error status from DB */}
          {isErr && (
            <span className="hc-meta-chip chip-error">
              <span className="chip-label">Error</span>
              <span className="chip-val">{errMsg || 'Failed'}</span>
            </span>
          )}

          {/* Measurement type */}
          {measType && (
            <span className="hc-meta-chip">
              <span className="chip-label">Type</span>
              <span className="chip-val">{capitalize(measType)}</span>
            </span>
          )}

          {/* Updated at */}
          {updatedAt && updatedAt !== createdAt && (
            <span className="hc-meta-chip">
              <span className="chip-label">Updated</span>
              <span className="chip-val">{tsUp.time}</span>
            </span>
          )}
        </div>

      </div>
    </div>
  );
}

// ── HistoryPage ───────────────────────────────────────────────────────────────
export default function HistoryPage({ onOpenModal }) {
  const { isLoggedIn } = useAuth();
  const { history, histFilter, setHistFilter, loading, loadHistory } = useHistory();

  useEffect(() => {
    if (isLoggedIn) loadHistory();
  }, [isLoggedIn]);

  const filters = [
    { key: 'all',         label: 'All',         icon: '◉' },
    { key: 'conversion',  label: 'Conversion',  icon: '⇄' },
    { key: 'addition',    label: 'Addition',    icon: '+' },
    { key: 'subtraction', label: 'Subtraction', icon: '−' },
    { key: 'division',    label: 'Division',    icon: '÷' },
    { key: 'comparison',  label: 'Comparison',  icon: '≈' },
    { key: 'error',       label: 'Errors',      icon: '⚠' },
  ];

  const filteredHistory = histFilter === 'all'
    ? history
    : histFilter === 'error'
      ? history.filter(i => extractError(i))
      : history.filter(i => extractOp(i) === histFilter);

  // Stats
  const total      = history.length;
  const errors     = history.filter(i => extractError(i)).length;
  const conversions= history.filter(i => extractOp(i) === 'conversion').length;
  const arithmetic = history.filter(i => ['addition','subtraction','division','comparison'].includes(extractOp(i))).length;
  const success    = total - errors;

  return (
    <div>
      <div className="section-head">
        <h2>Operation History</h2>
        <p>Full log of every calculation — with timestamps, inputs, units and results from your account.</p>
      </div>

      {/* ── Auth gate ── */}
      {!isLoggedIn ? (
        <div className="auth-gate">
          <div className="auth-gate-icon">🔒</div>
          <h3>Sign in to view history</h3>
          <p>Your calculation history is saved to your account. Every operation — with full details — is logged here.</p>
          <div className="auth-gate-btns">
            <button className="btn btn-secondary" onClick={() => onOpenModal('login')}>Sign In</button>
            <button className="btn btn-primary"   onClick={() => onOpenModal('register')}>Create Account</button>
          </div>
        </div>
      ) : (
        <div>
          {/* ── Stats bar ── */}
          {!loading && total > 0 && (
            <div className="history-stats-bar">
              <div className="hsb-item">
                <div className="hsb-val">{total}</div>
                <div className="hsb-label">Total Ops</div>
              </div>
              <div className="hsb-item">
                <div className="hsb-val">{success}</div>
                <div className="hsb-label">Successful</div>
              </div>
              <div className="hsb-item">
                <div className="hsb-val">{conversions}</div>
                <div className="hsb-label">Conversions</div>
              </div>
              <div className="hsb-item">
                <div className="hsb-val">{arithmetic}</div>
                <div className="hsb-label">Arithmetic</div>
              </div>
              <div className="hsb-item">
                <div className="hsb-val" style={{ background: errors > 0 ? 'var(--grad2)' : 'var(--grad1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {errors}
                </div>
                <div className="hsb-label">Errors</div>
              </div>
            </div>
          )}

          {/* ── Filter chips ── */}
          <div className="history-filters" style={{ marginBottom: '1.25rem' }}>
            {filters.map(f => (
              <button
                key={f.key}
                className={`filter-chip${histFilter === f.key ? ' active' : ''}${f.key === 'error' ? ' error-chip' : ''}`}
                onClick={() => setHistFilter(f.key)}
              >
                <span style={{ fontFamily: 'var(--mono)', marginRight: '4px' }}>{f.icon}</span>
                {f.label}
                {/* Count badge */}
                {f.key !== 'all' && (
                  <span style={{
                    marginLeft: '5px',
                    background: histFilter === f.key ? 'rgba(255,255,255,0.25)' : 'var(--bg3)',
                    borderRadius: '10px',
                    padding: '1px 7px',
                    fontSize: '10px',
                    fontFamily: 'var(--mono)',
                    fontWeight: 700,
                    color: histFilter === f.key ? '#fff' : 'var(--text3)',
                  }}>
                    {f.key === 'error'
                      ? errors
                      : history.filter(i => extractOp(i) === f.key).length}
                  </span>
                )}
                {f.key === 'all' && (
                  <span style={{
                    marginLeft: '5px',
                    background: histFilter === 'all' ? 'rgba(255,255,255,0.25)' : 'var(--bg3)',
                    borderRadius: '10px', padding: '1px 7px',
                    fontSize: '10px', fontFamily: 'var(--mono)', fontWeight: 700,
                    color: histFilter === 'all' ? '#fff' : 'var(--text3)',
                  }}>{total}</span>
                )}
              </button>
            ))}

            {/* Refresh button */}
            <button
              className="filter-chip"
              onClick={loadHistory}
              disabled={loading}
              style={{ marginLeft: 'auto', color: 'var(--accent)', borderColor: 'var(--border2)' }}
            >
              {loading ? 'Loading…' : '↻ Refresh'}
            </button>
          </div>

          {/* ── Content ── */}
          {loading ? (
            <div className="history-empty">
              <div className="big" style={{ fontSize: '32px' }}>⋯</div>
              <div style={{ color: 'var(--text2)', fontWeight: 500 }}>Loading your history…</div>
              <div style={{ fontSize: '12px', marginTop: '6px' }}>Fetching from your account</div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="history-empty">
              <div className="big">📭</div>
              <div style={{ color: 'var(--text2)', fontWeight: 500 }}>
                {histFilter === 'all' ? 'No operations yet' : `No ${histFilter} operations found`}
              </div>
              <div style={{ fontSize: '12px', marginTop: '6px' }}>
                {histFilter === 'all'
                  ? 'Start converting or calculating — results will appear here.'
                  : 'Try a different filter to see other operations.'}
              </div>
            </div>
          ) : (
            <div className="history-list">
              {filteredHistory.map((item, idx) => (
                <HistoryCard key={item.entity_id ?? item.EntityId ?? idx} item={item} idx={idx} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
