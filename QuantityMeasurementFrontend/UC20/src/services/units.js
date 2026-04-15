// ── Unit definitions ──────────────────────────────────────────────────────────
export const UNITS = {
  length:      ['Feet', 'Inch', 'Yard', 'Centimeter'],
  weight:      ['Kilogram', 'Gram', 'Pound'],
  volume:      ['Litre', 'Millilitre', 'Gallon'],
  temperature: ['Celsius', 'Fahrenheit', 'Kelvin'],
};

// ── Conversion factors (relative to base unit) ────────────────────────────────
const FACTORS = {
  length:      { Feet: 0.3048, Inch: 0.0254, Yard: 0.9144, Centimeter: 0.01 },
  weight:      { Kilogram: 1, Gram: 0.001, Pound: 0.453592 },
  volume:      { Litre: 1, Millilitre: 0.001, Gallon: 3.78541 },
  temperature: null,
};

function toBaseTemp(val, unit) {
  if (unit === 'Celsius')    return val;
  if (unit === 'Fahrenheit') return (val - 32) * 5 / 9;
  if (unit === 'Kelvin')     return val - 273.15;
  return val;
}

function fromBaseTemp(val, unit) {
  if (unit === 'Celsius')    return val;
  if (unit === 'Fahrenheit') return val * 9 / 5 + 32;
  if (unit === 'Kelvin')     return val + 273.15;
  return val;
}

function toBase(val, unit, type) {
  if (type === 'temperature') return toBaseTemp(val, unit);
  return val * (FACTORS[type][unit] || 1);
}

function fromBase(val, unit, type) {
  if (type === 'temperature') return fromBaseTemp(val, unit);
  return val / (FACTORS[type][unit] || 1);
}

// ── Local conversion (offline fallback) ──────────────────────────────────────
export function localConvert(val, from, to, type) {
  const base   = toBase(val, from, type);
  const result = fromBase(base, to, type);
  return {
    ResultValueDTOs: result,
    ResultUnitDTOs: to,
    IsThereErrorDTOs: false,
    OperationDTOs: 'conversion',
    ThisValueDTOs: val,
    ThisUnitDTOs: from,
  };
}

// ── Local arithmetic (offline fallback) ──────────────────────────────────────
export function localArithmetic(aVal, aUnit, bVal, bUnit, tUnit, op, type) {
  try {
    const aBase = toBase(aVal, aUnit, type);
    const bBase = toBase(bVal, bUnit, type);
    let resultBase;

    if (op === 'addition')         resultBase = aBase + bBase;
    else if (op === 'subtraction') resultBase = aBase - bBase;
    else if (op === 'division') {
      if (bBase === 0) throw new Error('Division by zero');
      resultBase = aBase / bBase;
    } else if (op === 'comparison') {
      const diff = aBase - bBase;
      const str  = diff === 0 ? 'A = B' : diff > 0 ? 'A > B' : 'A < B';
      return { ResultValueDTOs: diff, ResultStringDTOs: str, ResultUnitDTOs: '', IsThereErrorDTOs: false, OperationDTOs: op };
    }

    const result = op === 'division' ? resultBase : fromBase(resultBase, tUnit, type);
    return { ResultValueDTOs: result, ResultUnitDTOs: op === 'division' ? '' : tUnit, IsThereErrorDTOs: false, OperationDTOs: op };
  } catch (e) {
    return { IsThereErrorDTOs: true, ErrorMessageDTOs: e.message, OperationDTOs: op };
  }
}

// ── Response field extractors ─────────────────────────────────────────────────
export function extractResultValue(res) {
  return res.ResultValueDTOs ?? res.resultValueDTOs ?? res.ResultValue ?? res.resultValue ?? res.Value ?? res.value ?? null;
}

export function extractResultUnit(res) {
  return res.ResultUnitDTOs ?? res.resultUnitDTOs ?? res.ResultUnit ?? res.resultUnit ?? res.Unit ?? res.unit ?? '';
}

export function extractResultString(res) {
  return res.ResultStringDTOs ?? res.resultStringDTOs ?? res.ResultString ?? res.resultString ?? null;
}

export function extractError(res) {
  return !!(res.IsThereErrorDTOs || res.isThereErrorDTOs || res.IsError || res.isError || res.HasError || res.hasError);
}

export function extractErrorMessage(res) {
  return res.ErrorMessageDTOs ?? res.errorMessageDTOs ?? res.ErrorMessage ?? res.errorMessage ?? res.Message ?? res.message ?? 'Unknown error';
}

export function extractOp(item) {
  const raw =
    item.OperationDTOs     ?? item.operationDTOs     ??
    item.EntityOperation   ?? item.entityOperation   ??
    item.Operation         ?? item.operation         ?? '';
  switch (raw.toLowerCase()) {
    case 'convert':    return 'conversion';
    case 'conversion': return 'conversion';
    case 'add':        return 'addition';
    case 'addition':   return 'addition';
    case 'subtract':   return 'subtraction';
    case 'subtraction':return 'subtraction';
    case 'divide':     return 'division';
    case 'division':   return 'division';
    case 'compare':    return 'comparison';
    case 'comparison': return 'comparison';
    default:           return raw.toLowerCase();
  }
}

// ── Formatting helpers ────────────────────────────────────────────────────────
export function formatNum(n) {
  if (n === undefined || n === null || (typeof n === 'number' && isNaN(n))) return '—';
  const rounded = Math.round(n * 1e8) / 1e8;
  return parseFloat(rounded.toPrecision(8)).toString();
}

export function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export function opSymbol(op) {
  return { addition: '+', subtraction: '−', division: '÷', comparison: '≈', conversion: '→' }[op] || op;
}
