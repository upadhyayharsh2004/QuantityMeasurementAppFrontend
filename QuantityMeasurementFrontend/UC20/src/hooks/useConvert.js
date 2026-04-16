import { useState, useCallback } from 'react';
import { UNITS, localConvert, extractResultValue, extractError, extractErrorMessage, formatNum } from '../services/units';
import { convertUnits } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { triggerHistoryRefresh } from './useHistory';

export function useConvert() {
  const { isLoggedIn } = useAuth();
  const { toast } = useToast();

  const [convType, setConvType] = useState('length');
  const [value, setValue] = useState('');
  const [fromUnit, setFromUnit] = useState(UNITS.length[0]);
  const [toUnit, setToUnit] = useState(UNITS.length[1]);
  const [result, setResult] = useState(null);  // { val, meta, isError }
  const [loading, setLoading] = useState(false);

  const handleTypeChange = useCallback((type) => {
    setConvType(type);
    setFromUnit(UNITS[type][0]);
    setToUnit(UNITS[type][1] || UNITS[type][0]);
    setResult(null);
  }, []);

  const handleSwap = useCallback(() => {
    setFromUnit(prev => {
      setToUnit(prev);
      return toUnit;
    });
  }, [toUnit]);

  const handleConvert = useCallback(async () => {
    const num = parseFloat(value);
    if (isNaN(num)) { toast('Please enter a value.', 'error'); return; }
    if (fromUnit === toUnit) { toast('From and to units are the same.', 'error'); return; }

    setLoading(true);
    try {
      let res;
      if (isLoggedIn) {
        const { data } = await convertUnits(num, fromUnit, toUnit, convType.charAt(0).toUpperCase() + convType.slice(1));
        res = data;
      } else {
        res = localConvert(num, fromUnit, toUnit, convType);
      }

      if (extractError(res)) {
        setResult({ isError: true, val: extractErrorMessage(res) || 'Error', meta: '' });
      } else {
        let resVal = extractResultValue(res);
        if (resVal === null || resVal === undefined || isNaN(resVal)) {
          const fb = localConvert(num, fromUnit, toUnit, convType);
          resVal = fb.ResultValueDTOs;
        }
        setResult({
          isError: false,
          val: `${formatNum(resVal)} ${toUnit}`,
          meta: `${num} ${fromUnit} → ${formatNum(resVal)} ${toUnit}`,
        });
        // ── Refresh history so last op is immediately visible ──
        if (isLoggedIn) triggerHistoryRefresh();
      }
    } catch (e) {
      setResult({ isError: true, val: e.response?.data?.title || e.message || 'Error', meta: '' });
    } finally {
      setLoading(false);
    }
  }, [value, fromUnit, toUnit, convType, isLoggedIn, toast]);

  const resetConvert = useCallback(() => {
    setValue('');
    setResult(null);
  }, []);

  return {
    convType, value, fromUnit, toUnit, result, loading,
    setConvType: handleTypeChange,
    setValue,
    setFromUnit,
    setToUnit,
    handleSwap,
    handleConvert,
    resetConvert,
  };
}
