import { useState, useCallback } from 'react';
import { fetchAllHistory, fetchHistoryByOp } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function useHistory() {
  const { isLoggedIn } = useAuth();
  const { toast } = useToast();

  const [history, setHistory]       = useState([]);
  const [histFilter, setHistFilter] = useState('all');
  const [loading, setLoading]       = useState(false);

  const loadHistory = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      let items = [];
      try {
        const { data } = await fetchAllHistory();
        if (Array.isArray(data)) items = data;
      } catch {
        // fallback: fetch per operation
        const OPS = ['Convert', 'Add', 'Subtract', 'Divide', 'Compare'];
        const results = await Promise.allSettled(OPS.map(op => fetchHistoryByOp(op)));
        for (const r of results) {
          if (r.status === 'fulfilled' && Array.isArray(r.value.data)) {
            items = items.concat(r.value.data);
          }
        }
      }
      setHistory(items);
    } catch (e) {
      toast('Could not load history: ' + (e.message || 'Error'), 'error');
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, toast]);

  return { history, histFilter, setHistFilter, loading, loadHistory };
}
