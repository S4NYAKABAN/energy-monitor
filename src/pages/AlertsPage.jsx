import { useState } from 'react';
import { ackAlert, ackAllAlerts, getAlerts } from '../api/mockApi.js';
import { useAsync, useDataVersion } from '../hooks/useAsync.js';
import AsyncState from '../components/AsyncState.jsx';
import Panel from '../components/Panel.jsx';
import { useToast } from '../components/Toast.jsx';

const LEVELS = [
  { id: 'all', label: 'Усі' },
  { id: 'critical', label: 'Критичні' },
  { id: 'warning', label: 'Попередження' },
  { id: 'info', label: 'Інформація' },
];
const LEVEL_LABEL = { critical: 'Критичне', warning: 'Попередження', info: 'Інформація' };
const timeFmt = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'short', timeStyle: 'short' });

export default function AlertsPage() {
  const v = useDataVersion();
  const state = useAsync(getAlerts, [v], { keep: true });
  const toast = useToast();
  const [level, setLevel] = useState('all');

  const onAck = async (id) => {
    await ackAlert(id);
    toast('Сповіщення підтверджено', 'ok');
  };

  const onAckAll = async () => {
    await ackAllAlerts();
    toast('Усі сповіщення підтверджено', 'ok');
  };

  return (
    <>
      <div className="page-head">
        <h1>Сповіщення</h1>
        <p className="muted">Події та попередження системи</p>
      </div>

      <Panel
        title="Журнал подій"
        action={
          <button className="btn" onClick={onAckAll} disabled={!state.data?.some((a) => !a.ack)}>
            Підтвердити всі
          </button>
        }
      >
        <div className="segmented" role="radiogroup" aria-label="Фільтр за рівнем">
          {LEVELS.map((l) => (
            <button key={l.id} role="radio" aria-checked={level === l.id} className={level === l.id ? 'on' : ''} onClick={() => setLevel(l.id)}>
              {l.label}
            </button>
          ))}
        </div>

        <AsyncState state={state}>
          {(list) => {
            const shown = list.filter((a) => level === 'all' || a.level === level);
            if (shown.length === 0) return <p className="empty">Сповіщень немає</p>;
            return (
              <ul className="alerts">
                {shown.map((a) => (
                  <li key={a.id} className={`alert alert-${a.level} ${a.ack ? 'is-ack' : ''}`}>
                    <div className="alert-body">
                      <span className={`pill pill-${a.level}`}>{LEVEL_LABEL[a.level]}</span>
                      <h3>{a.title}</h3>
                      <p>{a.text}</p>
                      <p className="muted small">{timeFmt.format(new Date(a.time))}</p>
                    </div>
                    {a.ack ? (
                      <span className="muted small">Підтверджено</span>
                    ) : (
                      <button className="btn" onClick={() => onAck(a.id)}>
                        Підтвердити
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            );
          }}
        </AsyncState>
      </Panel>
    </>
  );
}
