import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { getVersion, subscribe } from '../api/mockApi.js';

export function useAsync(fn, deps, { keep = false } = {}) {
  const [state, setState] = useState({ data: undefined, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    if (!keep) setState({ data: undefined, error: null });
    fn()
      .then((data) => alive && setState({ data, error: null }))
      .catch((error) => alive && setState({ data: undefined, error }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => {
    setState({ data: undefined, error: null });
    setTick((t) => t + 1);
  }, []);

  return { ...state, loading: state.data === undefined && !state.error, reload };
}

export const useDataVersion = () => useSyncExternalStore(subscribe, getVersion);
