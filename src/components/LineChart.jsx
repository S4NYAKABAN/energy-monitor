import { useMemo, useState } from 'react';
import { scaleLinear, scalePoint } from 'd3-scale';
import { area, curveMonotoneX, line } from 'd3-shape';
import { max } from 'd3-array';
import { useSize } from '../hooks/useSize.js';

const M = { top: 12, right: 16, bottom: 28, left: 44 };

export default function LineChart({ data, series, unit = '', height = 280, yMax, label }) {
  const [wrapRef, width] = useSize();
  const [hover, setHover] = useState(null);
  const n = data.length;
  const innerW = width - M.left - M.right;
  const innerH = height - M.top - M.bottom;

  const x = useMemo(
    () =>
      scalePoint()
        .domain(data.map((d) => d.label))
        .range([M.left, M.left + innerW]),
    [data, innerW]
  );

  const top = yMax ?? (max(data, (d) => Math.max(...series.map((s) => d[s.key]))) || 1) * 1.1;
  const y = scaleLinear().domain([0, top]).nice().range([M.top + innerH, M.top]);

  const linePath = (key) =>
    line()
      .x((d) => x(d.label))
      .y((d) => y(d[key]))
      .curve(curveMonotoneX)(data);

  const areaPath = (key) =>
    area()
      .x((d) => x(d.label))
      .y0(y(0))
      .y1((d) => y(d[key]))
      .curve(curveMonotoneX)(data);

  const step = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(innerW / 56))));

  const pick = (clientX) => {
    const box = wrapRef.current.getBoundingClientRect();
    const i = Math.round((clientX - box.left - M.left) / (x.step() || 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  };

  const onKey = (e) => {
    if (e.key === 'ArrowRight') setHover((h) => (h === null ? 0 : Math.min(n - 1, h + 1)));
    if (e.key === 'ArrowLeft') setHover((h) => (h === null ? n - 1 : Math.max(0, h - 1)));
    if (e.key === 'Escape') setHover(null);
  };

  const active = hover !== null ? data[hover] : null;

  return (
    <div className="chart" ref={wrapRef}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={label}
        tabIndex={0}
        onPointerMove={(e) => pick(e.clientX)}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onKey}
        onBlur={() => setHover(null)}
      >
        {y.ticks(5).map((t) => (
          <g key={t}>
            <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} className="chart-grid" />
            <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="chart-tick">
              {t}
            </text>
          </g>
        ))}
        {data.map((d, i) =>
          i % step === 0 ? (
            <text key={d.label} x={x(d.label)} y={height - 8} textAnchor="middle" className="chart-tick">
              {d.label}
            </text>
          ) : null
        )}
        {series
          .filter((s) => s.area)
          .map((s) => (
            <path key={`a-${s.key}`} d={areaPath(s.key)} style={{ fill: s.color }} className="chart-area" />
          ))}
        {series.map((s) => (
          <path
            key={s.key}
            d={linePath(s.key)}
            style={{ stroke: s.color }}
            strokeDasharray={s.dashed ? '6 4' : undefined}
            className="chart-line"
          />
        ))}
        {active && (
          <g>
            <line x1={x(active.label)} x2={x(active.label)} y1={M.top} y2={M.top + innerH} className="chart-cursor" />
            {series.map((s) => (
              <circle key={s.key} cx={x(active.label)} cy={y(active[s.key])} r="4" style={{ fill: s.color }} className="chart-dot" />
            ))}
          </g>
        )}
      </svg>
      {active && (
        <div className="tooltip" style={{ left: Math.max(0, Math.min(width - 180, x(active.label) + 12)) }}>
          <strong>{active.label}</strong>
          {series.map((s) => (
            <span key={s.key}>
              <i style={{ background: s.color }} />
              {s.label}: {active[s.key]} {s.unit ?? unit}
            </span>
          ))}
        </div>
      )}
      <ul className="legend">
        {series.map((s) => (
          <li key={s.key}>
            <i style={{ background: s.color }} />
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
