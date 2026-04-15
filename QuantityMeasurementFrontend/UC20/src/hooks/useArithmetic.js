import { useState, useCallback } from 'react';
import {
  UNITS, localArithmetic,
  extractResultValue, extractResultUnit, extractResultString,
  extractError, extractErrorMessage, formatNum, capitalize, opSymbol
} from '../services/units';
import { doArithmetic } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function useArithmetic() {
  const { isLoggedIn } = useAuth();
  const { toast } = useToast();

  const [arithOp, setArithOp]     = useState('addition');
  const [measType, setMeasType]   = useState('length');
  const [aValue, setAValue]       = useState('');
  const [aUnit, setAUnit]         = useState(UNITS.length[0]);
  const [bValue, setBValue]       = useState('');
  const [bUnit, setBUnit]         = useState(UNITS.length[0]);
  const [targetUnit, setTargetUnit] = useState(UNITS.length[0]);
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);

  const handleTypeChange = useCallback((type) => {
    setMeasType(type);
    setAUnit(UNITS[type][0]);
    setBUnit(UNITS[type][0]);
    setTargetUnit(UNITS[type][0]);
    setResult(null);
  }, []);

  const handleCalculate = useCallback(async () => {
    const aNum = parseFloat(aValue);
    const bNum = parseFloat(bValue);
    if (isNaN(aNum)) { toast('Please enter a value for Quantity A.', 'error'); return; }
    if (isNaN(bNum)) { toast('Please enter a value for Quantity B.', 'error'); return; }

    setLoading(true);
    try {
      let res;
      if (isLoggedIn) {
        const { data } = await doArithmetic(arithOp, aNum, aUnit, bNum, bUnit, targetUnit, capitalize(measType));
        res = data;
      } else {
        res = localArithmetic(aNum, aUnit, bNum, bUnit, targetUnit, arithOp, measType);
      }

      if (extractError(res)) {
        setResult({ isError: true, val: extractErrorMessage(res) || 'Error', meta: '' });
        return;
      }

      const meta = `${aNum} ${aUnit} ${opSymbol(arithOp)} ${bNum} ${bUnit}`;

      if (arithOp === 'comparison') {
        const str = extractResultString(res);
        const num = extractResultValue(res);
        setResult({ isError: false, val: str || (num === 0 ? 'A = B' : num > 0 ? 'A > B' : 'A < B'), meta });
      } else {
        let num  = extractResultValue(res);
        const unit = extractResultUnit(res) || targetUnit;
        if (num === null || num === undefined || isNaN(num)) {
          const fb = localArithmetic(aNum, aUnit, bNum, bUnit, targetUnit, arithOp, measType);
          num = fb.ResultValueDTOs;
        }
        setResult({ isError: false, val: `${formatNum(num)} ${unit}`, meta });
      }
    } catch (e) {
      setResult({ isError: true, val: e.response?.data?.title || e.message || 'Error', meta: '' });
    } finally {
      setLoading(false);
    }
  }, [aValue, aUnit, bValue, bUnit, targetUnit, arithOp, measType, isLoggedIn, toast]);

  const resetArithmetic = useCallback(() => {
    setAValue('');
    setBValue('');
    setResult(null);
  }, []);

  return {
    arithOp, measType, aValue, aUnit, bValue, bUnit, targetUnit, result, loading,
    setArithOp: (op) => { setArithOp(op); setResult(null); },
    setMeasType: handleTypeChange,
    setAValue, setAUnit,
    setBValue, setBUnit,
    setTargetUnit,
    handleCalculate,
    resetArithmetic,
  };
}
