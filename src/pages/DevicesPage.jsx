import { useMemo, useState } from 'react';
import { getDevices, toggleDevice } from '../api/mockApi.js';
import { useAsync, useDataVersion } from '../hooks/useAsync.js';
import { sanitizeText } from '../utils/validation.js';
import { sortBy } from '../utils/energy.js';
import AsyncState from '../components/AsyncState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Panel from '../components/Panel.jsx';
import Switch from '../components/Switch.jsx';
import { useToast } from '../components/Toast.jsx';

const FILTERS = [
  { id: 'all', label: 'Усі' },
  { id: 'on', label: 'Увімкнені' },
  { id: 'off', label: 'Вимкнені' },
];

const COLUMNS = [
  { key: 'name', title: 'Пристрій' },
  { key: 'zone', title: 'Зона' },
  { key: 'rated', title: 'Потужність, кВт' },
  { key: 'daily', title: 'За добу, кВт·год' },
  { key: 'on', title: 'Стан' },
];

export default function DevicesPage() {
  const v = useDataVersion();
  const state = useAsync(getDevices, [v], { keep: true });
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });
  const [pending, setPending] = useState(null);

  const doToggle = async (d) => {
    await toggleDevice(d.id);
    toast(`${d.name}: ${d.on ? 'вимкнено' : 'увімкнено'}`, 'ok');
  };

  const onSwitch = (d) => {
    if (d.critical && d.on) setPending(d);
    else doToggle(d);
  };

  const rows = useMemo(() => {
    if (!state.data) return [];
    const q = sanitizeText(query, 40).toLowerCase();
    const list = state.data
      .map((d) => ({ ...d, onNum: d.on ? 1 : 0 }))
      .filter((d) => (filter === 'all' ? true : filter === 'on' ? d.on : !d.on))
      .filter((d) => !q || d.name.toLowerCase().includes(q) || d.zone.toLowerCase().includes(q));
    return sortBy(list, sort.key === 'on' ? 'onNum' : sort.key, sort.dir);
  }, [state.data, query, filter, sort]);

  const toggleSort = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  const ariaSort = (key) => (sort.key !== key ? 'none' : sort.dir === 'asc' ? 'ascending' : 'descending');

  return (
    <>
      <div className="page-head">
        <h1>Пристрої та лінії живлення</h1>
        <p className="muted">Керування навантаженням системи</p>
      </div>

      <Panel title="Список пристроїв">
        <div className="toolbar">
          <div>
            <label htmlFor="search" className="sr-only">Пошук пристрою</label>
            <input id="search" type="search" placeholder="Пошук за назвою або зоною" value={query} onChange={(e) => setQuery(e.target.value)} maxLength={40} />
          </div>
          <div className="segmented" role="radiogroup" aria-label="Фільтр за станом">
            {FILTERS.map((f) => (
              <button key={f.id} role="radio" aria-checked={filter === f.id} className={filter === f.id ? 'on' : ''} onClick={() => setFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <AsyncState state={state}>
          {() => (
            <div className="table-wrap">
              <table className="table">
                <caption className="sr-only">Пристрої системи та їх споживання</caption>
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
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={COLUMNS.length} className="empty">
                        Нічого не знайдено
                      </td>
                    </tr>
                  )}
                  {rows.map((d) => (
                    <tr key={d.id}>
                      <th scope="row">
                        {d.name}
                        {d.critical && <span className="pill pill-info tag">Критичний</span>}
                      </th>
                      <td>{d.zone}</td>
                      <td>{d.rated}</td>
                      <td>{d.daily}</td>
                      <td>
                        <Switch checked={d.on} label={`${d.name}: ${d.on ? 'увімкнено' : 'вимкнено'}`} onChange={() => onSwitch(d)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AsyncState>
      </Panel>

      <ConfirmDialog
        open={Boolean(pending)}
        title="Вимкнути критичний пристрій?"
        text={pending ? `«${pending.name}» позначено як критичний. Вимкнення може вплинути на роботу системи.` : ''}
        confirmLabel="Вимкнути"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          const d = pending;
          setPending(null);
          doToggle(d);
        }}
      />
    </>
  );
}
