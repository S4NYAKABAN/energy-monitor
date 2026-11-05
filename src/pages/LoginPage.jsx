import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { validateLogin } from '../utils/validation.js';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validateLogin(form);
    setErrors(found);
    setMessage('');
    if (Object.keys(found).length) return;
    setBusy(true);
    const res = await login(form);
    setBusy(false);
    if (res.ok) return;
    if (res.locked) setMessage(`Забагато спроб. Спробуйте через ${res.locked} с.`);
    else if (res.form) setMessage(`${res.form}. Залишилось спроб: ${res.left}.`);
  };

  return (
    <main className="auth">
      <form className="auth-card" onSubmit={onSubmit} noValidate aria-labelledby="login-title">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>Енергомоніторинг</span>
        </div>
        <h1 id="login-title">Вхід у систему</h1>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          value={form.email}
          onChange={set('email')}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-err' : undefined}
          maxLength={254}
        />
        {errors.email && (
          <p id="email-err" className="field-error">
            {errors.email}
          </p>
        )}

        <label htmlFor="password">Пароль</label>
        <div className="input-row">
          <input
            id="password"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            value={form.password}
            onChange={set('password')}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-err' : undefined}
            maxLength={128}
          />
          <button type="button" className="btn" onClick={() => setShow((s) => !s)} aria-pressed={show}>
            {show ? 'Сховати' : 'Показати'}
          </button>
        </div>
        {errors.password && (
          <p id="password-err" className="field-error">
            {errors.password}
          </p>
        )}

        {message && (
          <p className="form-error" role="alert">
            {message}
          </p>
        )}

        <button type="submit" className="btn btn-primary btn-wide" disabled={busy}>
          {busy ? 'Перевірка…' : 'Увійти'}
        </button>

        <p className="muted small">Демо-доступ: admin@energy.local / Energy2026!</p>
      </form>
    </main>
  );
}
