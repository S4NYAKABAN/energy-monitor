import { useMemo, useState } from 'react';
import { useSettings } from '../context/SettingsContext.jsx';
import { getSeries } from '../api/mockApi.js';
import { useAsync } from '../hooks/useAsync.js';
import { average, calcCost, peakRow, round, selfSufficiency, sortBy, sum } from '../utils/energy.js';
import { downloadCsv, toCsv } from '../utils/csv.js';
import AsyncState from '../components/AsyncState.jsx';
import LineChart from '../components/LineChart.jsx';
import Panel from '../components/Panel.jsx';
import StatCard from '../components/StatCard.jsx';
import { useToast } from '../components/Toast.jsx';

const RANGES = [
  { id: 'day', label: 'Доба' },
  { id: 'week', label: 'Тиждень' },
  { id: 'month', label: 'Місяць' },
];

const COLUMNS = [
  { key: 'label', title: 'Період' },
  { key: 'consumption', title: 'Споживання, кВт·год' },
  { key: 'generation', title: 'Генерація, кВт·год' },
  { key: 'soc', title: 'Заряд АКБ, %' },
];

function Results({ rows, range }) {
  const { settings } = useSettings();
  const toast = useToast();
  const [sort, setSort] = useState({ key: 'idx', dir: 'asc' });

  const indexed = useMemo(() => rows.map((r, idx) => ({ ...r, idx })), [rows]);
  const sorted = useMemo(() => sortBy(indexed, sort.key, sort.dir), [indexed, sort]);

  const total = round(sum(rows.map((r) => r.consumption)), 1);
  const generated = round(sum(rows.map((r) => r.generation)), 1);
  const peak = peakRow(rows);

  const toggleSort = (key) => {
    const k = key === 'label' ? 'idx' : key;
    setSort((s) => (s.key === k ? { key: k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: 'asc' }));
  };

  const ariaSort = (key) => {
    const k = key === 'label' ? 'idx' : key;
    if (sort.key !== k) return 'none';
    return sort.dir === 'asc' ? 'ascending' : 'descending';
  };

  const exportCsv = () => {
    downloadCsv(`energy-${range}.csv`, toCsv(rows, COLUMNS));
    toast('Файл CSV сформовано', 'ok');
  };

  return (
    <>
      <div className="grid stats">
        <StatCard label="Спожито" value={total} unit="кВт·год" hint={`Вартість ≈ ${calcCost(total, settings.tariff)} грн`} tone="primary" />
        <StatCard label="Згенеровано СЕС" value={generated} unit="кВт·год" />
        <StatCard label="Середнє споживання" value={round(average(rows.map((r) => r.consumption)), 2)} unit="кВт·год" hint={`Пік: ${peak?.label ?? '-'}`} />
        <StatCard label="Енергонезалежність" value={selfSufficiency(rows)} unit="%" hint="Частка покрита СЕС" tone="ok" />
      </div>

      <Panel title="Динаміка">
        <LineChart
          data={rows}
          unit="кВт·год"
          label="Графік споживання та генерації за обраний період"
          series={[
            { key: 'consumption', label: 'Споживання', color: 'var(--c1)', area: true },
            { key: 'generation', label: 'Генерація СЕС', color: 'var(--c2)', dashed: true },
          ]}
        />
      </Panel>

      <Panel
        title="Дані по періодах"
        action={
          <button className="btn" onClick={exportCsv}>
            Експорт CSV
          </button>
        }
      >
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">Споживання, генерація та заряд АКБ по періодах</caption>
            <thead>
              <tr>
                {COLUMNS.map((c) => (
                  <th key={c.key} scope="col" aria-sort={ariaSort(c.key)}>
                    <button className="th-btn" onClick={() => toggleSort(c.key)}>
                      {c.title}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.label}>
                  <th scope="row">{r.label}</th>
                  <td>{r.consumption}</td>
                  <td>{r.generation}</td>
                  <td>{r.soc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState('day');
  const state = useAsync(() => getSeries(range), [range]);

  return (
    <>
      <div className="page-head">
        <h1>Аналітика енергоспоживання</h1>
        <div className="segmented" role="radiogroup" aria-label="Період аналізу">
          {RANGES.map((r) => (
            <button key={r.id} role="radio" aria-checked={range === r.id} className={range === r.id ? 'on' : ''} onClick={() => setRange(r.id)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <AsyncState state={state} height={320}>
        {(rows) => <Results rows={rows} range={range} />}
      </AsyncState>
    </>
  );
}
