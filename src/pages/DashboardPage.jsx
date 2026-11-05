import { Link } from '../router.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { getAlerts, getDevices, getOverview, getSeries } from '../api/mockApi.js';
import { useAsync, useDataVersion } from '../hooks/useAsync.js';
import { useLiveReading } from '../hooks/useLiveReading.js';
import { batteryLevel, estimateRuntime, formatHours, round, sortBy } from '../utils/energy.js';
import AsyncState from '../components/AsyncState.jsx';
import BatteryGauge from '../components/BatteryGauge.jsx';
import LineChart from '../components/LineChart.jsx';
import Panel from '../components/Panel.jsx';
import StatCard from '../components/StatCard.jsx';

export const MODES = {
  solar: 'Живлення від СЕС',
  battery: 'Живлення від АКБ',
  grid: 'Живлення від мережі',
};

const LEVEL_LABEL = { critical: 'Критичне', warning: 'Попередження', info: 'Інформація' };

const dateFmt = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'full' });
const timeFmt = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'short', timeStyle: 'short' });

function LiveStat({ overview }) {
  const live = useLiveReading(overview.power);
  return <StatCard label="Поточне споживання" value={live} unit="кВт" hint="Оновлюється кожні 4 с" tone="primary" />;
}

export default function DashboardPage() {
  const { settings } = useSettings();
  const v = useDataVersion();
  const overview = useAsync(getOverview, []);
  const series = useAsync(() => getSeries('day'), []);
  const devices = useAsync(getDevices, [v], { keep: true });
  const alerts = useAsync(getAlerts, [v], { keep: true });

  return (
    <>
      <div className="page-head">
        <h1>Огляд системи</h1>
        <p className="muted">{dateFmt.format(new Date())}</p>
      </div>

      <AsyncState state={overview} height={110}>
        {(o) => {
          const level = batteryLevel(o.soc, settings.threshold);
          return (
            <div className="grid stats">
              <LiveStat overview={o} />
              <StatCard label="Спожито сьогодні" value={o.consumedToday} unit="кВт·год" hint={`≈ ${round(o.consumedToday * settings.tariff, 0)} грн`} />
              <StatCard label="Генерація СЕС" value={o.generation} unit="кВт" hint={`Сьогодні: ${o.generatedToday} кВт·год`} />
              <StatCard
                label="Заряд АКБ"
                value={o.soc}
                unit="%"
                hint={level === 'ok' ? 'У нормі' : 'Нижче порогу'}
                tone={level === 'ok' ? 'ok' : level === 'low' ? 'warn' : 'danger'}
              />
            </div>
          );
        }}
      </AsyncState>

      <div className="grid cols-main">
        <Panel title="Споживання та генерація за добу">
          <AsyncState state={series} height={300}>
            {(rows) => (
              <LineChart
                data={rows}
                unit="кВт"
                label="Графік споживання та генерації за добу"
                series={[
                  { key: 'consumption', label: 'Споживання', color: 'var(--c1)', area: true },
                  { key: 'generation', label: 'Генерація СЕС', color: 'var(--c2)', dashed: true },
                ]}
              />
            )}
          </AsyncState>
        </Panel>

        <Panel title="Автономне живлення" action={<Link to="/autonomy" className="link">Деталі</Link>}>
          <AsyncState state={overview} height={240}>
            {(o) => {
              const level = batteryLevel(o.soc, settings.threshold);
              const hours = estimateRuntime(settings.capacity, o.soc, o.power, settings.threshold);
              return (
                <div className="autonomy-mini">
                  <BatteryGauge soc={o.soc} level={level} />
                  <dl className="kv">
                    <div>
                      <dt>Режим</dt>
                      <dd>{MODES[o.mode]}</dd>
                    </div>
                    <div>
                      <dt>Автономність при поточному навантаженні</dt>
                      <dd>{formatHours(hours)}</dd>
                    </div>
                  </dl>
                </div>
              );
            }}
          </AsyncState>
        </Panel>
      </div>

      <div className="grid cols-2">
        <Panel title="Найбільші споживачі за добу" action={<Link to="/devices" className="link">Усі пристрої</Link>}>
          <AsyncState state={devices}>
            {(list) => {
              const top = sortBy(list, 'daily', 'desc').slice(0, 5);
              const peak = top[0]?.daily || 1;
              return (
                <ul className="bars">
                  {top.map((d) => (
                    <li key={d.id}>
                      <div className="bars-row">
                        <span>{d.name}</span>
                        <strong>{d.daily} кВт·год</strong>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${(d.daily / peak) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              );
            }}
          </AsyncState>
        </Panel>

        <Panel title="Останні сповіщення" action={<Link to="/alerts" className="link">Усі сповіщення</Link>}>
          <AsyncState state={alerts}>
            {(list) => (
              <ul className="mini-alerts">
                {list.slice(0, 4).map((a) => (
                  <li key={a.id} className={a.ack ? 'is-ack' : ''}>
                    <span className={`pill pill-${a.level}`}>{LEVEL_LABEL[a.level]}</span>
                    <div>
                      <strong>{a.title}</strong>
                      <p className="muted small">{timeFmt.format(new Date(a.time))}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AsyncState>
        </Panel>
      </div>
    </>
  );
}
