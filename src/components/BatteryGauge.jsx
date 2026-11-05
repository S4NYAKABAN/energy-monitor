const LABELS = { ok: 'Норма', low: 'Низький', critical: 'Критичний' };

export default function BatteryGauge({ soc, level }) {
  const R = 54;
  const C = 2 * Math.PI * R;
  return (
    <div className="gauge" role="img" aria-label={`Заряд батареї ${soc} відсотків, рівень: ${LABELS[level]}`}>
      <svg viewBox="0 0 140 140" aria-hidden="true">
        <circle cx="70" cy="70" r={R} className="gauge-track" />
        <circle
          cx="70"
          cy="70"
          r={R}
          className={`gauge-value gauge-${level}`}
          strokeDasharray={`${(C * soc) / 100} ${C}`}
          transform="rotate(-90 70 70)"
        />
      </svg>
      <div className="gauge-text">
        <strong>{soc}%</strong>
        <span>{LABELS[level]}</span>
      </div>
    </div>
  );
}
