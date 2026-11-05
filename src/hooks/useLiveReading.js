import { useEffect, useState } from 'react';
import { round } from '../utils/energy.js';

export function useLiveReading(base, interval = 4000) {
  const [value, setValue] = useState(base);

  useEffect(() => {
    setValue(base);
    if (base === undefined || base === null) return undefined;
    const id = setInterval(() => {
      setValue(round(Math.max(0.05, base * (0.92 + Math.random() * 0.16)), 2));
    }, interval);
    return () => clearInterval(id);
  }, [base, interval]);

  return value;
}
