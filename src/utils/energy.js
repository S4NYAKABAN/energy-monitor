export const round = (n, d = 2) => {
  const f = 10 ** d;
  return Math.round((n + Number.EPSILON) * f) / f;
};

export const sum = (arr) => arr.reduce((a, b) => a + b, 0);

export const average = (arr) => (arr.length ? sum(arr) / arr.length : 0);

export const calcCost = (kwh, tariff) => round(kwh * tariff, 2);

export function estimateRuntime(capacityKwh, soc, loadKw, reserve = 10) {
  if (loadKw <= 0) return Infinity;
  const usable = (capacityKwh * Math.max(soc - reserve, 0)) / 100;
  return round(usable / loadKw, 1);
}

export function formatHours(h) {
  if (!Number.isFinite(h)) return 'необмежено';
  if (h >= 48) return `${round(h / 24, 1)} діб`;
  const total = Math.round(h * 60);
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  if (hh === 0) return `${mm} хв`;
  if (mm === 0) return `${hh} год`;
  return `${hh} год ${mm} хв`;
}

export function batteryLevel(soc, threshold) {
  if (soc <= threshold / 2) return 'critical';
  if (soc <= threshold) return 'low';
  return 'ok';
}

export function selfSufficiency(rows) {
  const cons = sum(rows.map((r) => r.consumption));
  if (cons <= 0) return 0;
  const covered = sum(rows.map((r) => Math.min(r.generation, r.consumption)));
  return round((covered / cons) * 100, 0);
}

export function peakRow(rows, key = 'consumption') {
  return rows.reduce((best, r) => (best === null || r[key] > best[key] ? r : best), null);
}

export function sortBy(rows, key, dir = 'asc') {
  const k = dir === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => {
    const x = a[key];
    const y = b[key];
    if (typeof x === 'number' && typeof y === 'number') return (x - y) * k;
    return String(x).localeCompare(String(y), 'uk') * k;
  });
}
