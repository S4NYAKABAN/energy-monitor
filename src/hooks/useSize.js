import { useLayoutEffect, useRef, useState } from 'react';

export function useSize(min = 280) {
  const ref = useRef(null);
  const [width, setWidth] = useState(600);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const set = (w) => setWidth(Math.max(min, Math.floor(w)));
    set(el.clientWidth || 600);
    const ro = new ResizeObserver(([entry]) => set(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [min]);

  return [ref, width];
}
