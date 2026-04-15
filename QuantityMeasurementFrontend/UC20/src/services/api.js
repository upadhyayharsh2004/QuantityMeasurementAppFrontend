import axios from 'axios';

const BASE_URL = 'http://localhost:5099'; // ← Change to your backend URL

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request if available
api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('qm_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const signIn = (email, password) =>
  api.post('/api/v1/auth/signin', { LoginEmail: email, LoginPassword: password });

export const signUp = (name, email, password) =>
  api.post('/api/v1/auth/signup', { UserName: name, UserEmail: email, UserPassword: password });

// ── Conversion ────────────────────────────────────────────────────────────────
export const convertUnits = (value, fromUnit, toUnit, measurementType) =>
  api.post('/api/v1/quantities/conversion', {
    ThisQuantityDTO: {
      ValueDTOs: value,
      UnitNameDTOs: fromUnit,
      MeasurementTypeDTOs: measurementType,
    },
    TargetUnitDTOs: toUnit,
  });

// ── Arithmetic ────────────────────────────────────────────────────────────────
export const doArithmetic = (operation, aVal, aUnit, bVal, bUnit, targetUnit, measurementType) =>
  api.post(`/api/v1/quantities/${operation}`, {
    ThisQuantityDTO:  { ValueDTOs: aVal, UnitNameDTOs: aUnit, MeasurementTypeDTOs: measurementType },
    ThereQuantityDTO: { ValueDTOs: bVal, UnitNameDTOs: bUnit, MeasurementTypeDTOs: measurementType },
    TargetUnitDTOs: targetUnit,
  });

// ── History ───────────────────────────────────────────────────────────────────
export const fetchAllHistory = () =>
  api.get('/api/v1/quantities/history/all');

export const fetchHistoryByOp = (op) =>
  api.get(`/api/v1/quantities/history/operation/${op}`);

export default api;
