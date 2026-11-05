import { useState } from 'react';
import { DEFAULTS, useSettings } from '../context/SettingsContext.jsx';
import { validateSettings } from '../utils/validation.js';
import Panel from '../components/Panel.jsx';
import { useToast } from '../components/Toast.jsx';

const THEMES = [
  { id: 'system', label: 'Системна' },
  { id: 'light', label: 'Світла' },
  { id: 'dark', label: 'Темна' },
];

const toForm = (s) => ({ ...s, tariff: String(s.tariff), threshold: String(s.threshold), capacity: String(s.capacity) });

export default function SettingsPage() {
  const { settings, update, reset } = useSettings();
  const toast = useToast();
  const [form, setForm] = useState(() => toForm(settings));
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    const res = validateSettings(form);
    setErrors(res.errors);
    if (Object.keys(res.errors).length) {
      toast('Перевірте виділені поля', 'error');
      return;
    }
    update(res.values);
    toast('Налаштування збережено', 'ok');
  };

  const onReset = () => {
    reset();
    setForm(toForm(DEFAULTS));
    setErrors({});
    toast('Відновлено значення за замовчуванням', 'info');
  };

  const field = (id, label, suffix) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-row">
        <input
          id={id}
          inputMode="decimal"
          value={form[id]}
          onChange={set(id)}
          aria-invalid={Boolean(errors[id])}
          aria-describedby={errors[id] ? `${id}-err` : undefined}
          maxLength={8}
        />
        <span className="muted">{suffix}</span>
      </div>
      {errors[id] && (
        <p id={`${id}-err`} className="field-error">
          {errors[id]}
        </p>
      )}
    </div>
  );

  return (
    <>
      <div className="page-head">
        <h1>Налаштування</h1>
        <p className="muted">Параметри розрахунків та відображення</p>
      </div>

      <Panel title="Параметри системи">
        <form className="settings" onSubmit={onSubmit} noValidate>
          {field('tariff', 'Тариф на електроенергію', 'грн/кВт·год')}
          {field('threshold', 'Поріг низького заряду АКБ', '%')}
          {field('capacity', 'Ємність батареї', 'кВт·год')}

          <fieldset className="field">
            <legend>Тема оформлення</legend>
            <div className="segmented" role="radiogroup" aria-label="Тема оформлення">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={form.theme === t.id}
                  className={form.theme === t.id ? 'on' : ''}
                  onClick={() => setForm((f) => ({ ...f, theme: t.id }))}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="check">
            <input type="checkbox" checked={form.notify} onChange={(e) => setForm((f) => ({ ...f, notify: e.target.checked }))} />
            Показувати сповіщення про критичні події
          </label>

          <div className="actions">
            <button type="submit" className="btn btn-primary">
              Зберегти
            </button>
            <button type="button" className="btn" onClick={onReset}>
              Скинути
            </button>
          </div>
        </form>
      </Panel>
    </>
  );
}
