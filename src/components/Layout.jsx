import { useEffect, useState } from 'react';
import { Link } from '../router.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { getUnackCount } from '../api/mockApi.js';
import { useDataVersion } from '../hooks/useAsync.js';

export const NAV = [
  { to: '/', label: 'Огляд' },
  { to: '/analytics', label: 'Аналітика' },
  { to: '/autonomy', label: 'Автономне живлення' },
  { to: '/devices', label: 'Пристрої' },
  { to: '/alerts', label: 'Сповіщення' },
  { to: '/settings', label: 'Налаштування' },
];

export default function Layout({ path, children }) {
  const { user, logout } = useAuth();
  const { settings, update } = useSettings();
  const [open, setOpen] = useState(false);
  useDataVersion();
  const unack = getUnackCount();
  const dark = document.documentElement.dataset.theme === 'dark';

  useEffect(() => {
    setOpen(false);
  }, [path]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="shell">
      <button className="skip" onClick={() => document.getElementById('main')?.focus()}>
        Перейти до вмісту
      </button>

      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Головне меню">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>Енергомоніторинг</span>
        </div>
        <nav>
          <ul>
            {NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className={`nav-link ${path === item.to ? 'active' : ''}`} aria-current={path === item.to ? 'page' : undefined}>
                  {item.label}
                  {item.to === '/alerts' && unack > 0 && (
                    <span className="badge" aria-label={`${unack} непідтверджених`}>
                      {unack}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      {open && <div className="backdrop" onClick={() => setOpen(false)} />}

      <div className="content">
        <header className="topbar">
          <button className="btn burger" aria-label="Відкрити меню" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            Меню
          </button>
          <div className="topbar-right">
            <button className="btn" onClick={() => update({ theme: dark ? 'light' : 'dark' })} aria-label="Змінити тему">
              {dark ? 'Світла тема' : 'Темна тема'}
            </button>
            <span className="user" title={user.email}>
              {user.name}
            </span>
            <button className="btn" onClick={logout}>
              Вийти
            </button>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="main">
          {children}
        </main>
      </div>
    </div>
  );
}
