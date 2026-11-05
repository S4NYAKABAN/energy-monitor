import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { validateSettings } from '../utils/validation.js';

const KEY = 'em_settings';
export const DEFAULTS = { tariff: 4.32, threshold: 20, capacity: 15, notify: true, theme: 'system' };

const SettingsContext = createContext(null);
export const useSettings = () => useContext(SettingsContext);

function load() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY));
    const { errors, values } = validateSettings({ ...DEFAULTS, ...stored });
    return Object.keys(errors).length ? DEFAULTS : values;
  } catch {
    return DEFAULTS;
  }
}

function save(values) {
  try {
    localStorage.setItem(KEY, JSON.stringify(values));
  } catch {
    /* storage off */
  }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(load);

  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && mq.matches);
      root.dataset.theme = dark ? 'dark' : 'light';
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [settings.theme]);

  const update = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      save(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    save(DEFAULTS);
    setSettings(DEFAULTS);
  }, []);

  const value = useMemo(() => ({ settings, update, reset }), [settings, update, reset]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
