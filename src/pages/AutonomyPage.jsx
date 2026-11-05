import { useState } from 'react';
import { useSettings } from '../context/SettingsContext.jsx';
import { getBattery, getSeries } from '../api/mockApi.js';
import { useAsync } from '../hooks/useAsync.js';
import { batteryLevel, estimateRuntime, formatHours } from '../utils/energy.js';
import { validateLoad } from '../utils/validation.js';
import AsyncState from '../components/AsyncState.jsx';
import BatteryGauge from '../components/BatteryGauge.jsx';
import LineChart from '../components/LineChart.jsx';
import Panel from '../components/Panel.jsx';
import { MODES } from './DashboardPage.jsx';

const STATUS = { charging: 'Заряджається', discharging: 'Розряджається', idle: 'Очікування' };

function Flow({ b }) {
  const grid = b.mode === 'grid' ? b.power : 0;
  return (
    <div className="flow-wrap">
      <div className="flow">
        <div className="flow-node">
          <span className="muted small">СЕС</span>
          <strong>{b.generation} кВт</strong>
        </div>
        <span className="flow-arrow" aria-hidden="true">→</span>
        <div className="flow-node flow-core">
          <span className="muted small">Інвертор</span>
          <strong>{b.inverter.loadPercent}% навантаження</strong>
        </div>
        <span className="flow-arrow" aria-hidden="true">→</span>
        <div className="flow-node">
          <span className="muted small">Споживачі</span>
          <strong>{b.power} кВт</strong>
        </div>
      </div>
      <div className="flow-extra">
        <div className="flow-node">
          <span className="muted small">АКБ: {STATUS[b.status].toLowerCase()}</span>
          <strong>{b.soc}%</strong>
        </div>
        <div className="flow-node">
          <span className="muted small">Мережа</span>
          <strong>{grid} кВт</strong>
        </div>
      </div>
    </div>
  );
}

function Calculator({ soc }) {
  const { settings } = useSettings();
  const [input, setInput] = useState('1,5');
  const check = validateLoad(input);
  const hours = check.ok ? estimateRuntime(settings.capacity, soc, check.value, settings.threshold) : null;

  return (
    <div className="calc">
      <label htmlFor="load">Потужність навантаження, кВт</label>
      <input
        id="load"
        inputMode="decimal"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        aria-invalid={!check.ok}
        aria-describedby="load-result"
        maxLength={8}
      />
      <p id="load-result" className={check.ok ? 'calc-result' : 'field-error'} aria-live="polite">
        {check.ok ? (
          <>
            Автономна робота: <strong>{formatHours(hours)}</strong>
          </>
        ) : (
          check.error
        )}
      </p>
      <p className="muted small">
        Розрахунок: ємність {settings.capacity} кВт·год, заряд {soc}%, резерв {settings.threshold}%.
      </p>
    </div>
  );
}

export default function AutonomyPage() {
  const { settings } = useSettings();
  const battery = useAsync(getBattery, []);
  const series = useAsync(() => getSeries('day'), []);

  return (
    <>
      <div className="page-head">
        <h1>Автономне живлення</h1>
        <p className="muted">Стан акумуляторів, інвертора та сонячної генерації</p>
      </div>

      <AsyncState state={battery} height={420}>
        {(b) => {
          const level = batteryLevel(b.soc, settings.threshold);
          return (
            <>
              <Panel title={`Потік енергії: ${MODES[b.mode]}`}>
                <Flow b={b} />
              </Panel>

              <div className="grid cols-3">
                <Panel title="Акумуляторна батарея">
                  <BatteryGauge soc={b.soc} level={level} />
                  <dl className="kv">
                    <div><dt>Стан</dt><dd>{STATUS[b.status]}</dd></div>
                    <div><dt>Напруга</dt><dd>{b.voltage} В</dd></div>
                    <div><dt>Струм</dt><dd>{b.current} А</dd></div>
                    <div><dt>Температура</dt><dd>{b.temperature} °C</dd></div>
                    <div><dt>Цикли заряду</dt><dd>{b.cycles}</dd></div>
                    <div><dt>Стан здоров'я</dt><dd>{b.health}%</dd></div>
                  </dl>
                </Panel>

                <Panel title="Інвертор">
                  <dl className="kv">
                    <div><dt>Вихідна напруга</dt><dd>{b.inverter.outputVoltage} В</dd></div>
                    <div><dt>Частота</dt><dd>{b.inverter.frequency} Гц</dd></div>
                    <div><dt>Завантаження</dt><dd>{b.inverter.loadPercent}%</dd></div>
                  </dl>
                  <div className="meter" role="img" aria-label={`Завантаження інвертора ${b.inverter.loadPercent} відсотків`}>
                    <div className="meter-fill" style={{ width: `${Math.min(100, b.inverter.loadPercent)}%` }} />
                  </div>
                </Panel>

                <Panel title="Калькулятор автономності">
                  <Calculator soc={b.soc} />
                </Panel>
              </div>
            </>
          );
        }}
      </AsyncState>

      <Panel title="Заряд АКБ протягом доби">
        <AsyncState state={series} height={260}>
          {(rows) => (
            <LineChart
              data={rows}
              unit="%"
              yMax={100}
              height={240}
              label="Графік заряду акумулятора за добу"
              series={[{ key: 'soc', label: 'Заряд АКБ', color: 'var(--c3)', area: true }]}
            />
          )}
        </AsyncState>
      </Panel>
    </>
  );
}
