import { useState, useCallback, useEffect } from 'react';
import { fetchAllHistory, fetchHistoryByOp } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Global event name — fired after every convert/arithmetic operation
export const HISTORY_REFRESH_EVENT = 'qm:history-refresh';

// Call this from any page after a successful operation to trigger history reload
export function triggerHistoryRefresh() {
  window.dispatchEvent(new CustomEvent(HISTORY_REFRESH_EVENT));
}

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

  // Listen for global refresh events dispatched after operations
  useEffect(() => {
    const handler = () => { if (isLoggedIn) loadHistory(); };
    window.addEventListener(HISTORY_REFRESH_EVENT, handler);
    return () => window.removeEventListener(HISTORY_REFRESH_EVENT, handler);
  }, [isLoggedIn, loadHistory]);

  return { history, histFilter, setHistFilter, loading, loadHistory };
}
