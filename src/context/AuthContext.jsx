import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { validateLogin } from '../utils/validation.js';

const KEY = 'em_session';
const IDLE_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const LOCK_SEC = 30;
const DEMO = { email: 'admin@energy.local', password: 'Energy2026!', name: 'Оператор системи' };

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function readSession() {
  try {
    const s = JSON.parse(sessionStorage.getItem(KEY));
    if (!s || !s.token || s.expires < Date.now()) return null;
    return s;
  } catch {
    return null;
  }
}

function makeToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);
  const attempts = useRef(0);
  const lockedUntil = useRef(0);

  const login = useCallback(async ({ email, password }) => {
    const errors = validateLogin({ email, password });
    if (Object.keys(errors).length) return { ok: false, errors };
    const now = Date.now();
    if (lockedUntil.current > now) {
      return { ok: false, locked: Math.ceil((lockedUntil.current - now) / 1000) };
    }
    await new Promise((r) => setTimeout(r, 600));
    if (email.trim().toLowerCase() === DEMO.email && password === DEMO.password) {
      attempts.current = 0;
      const s = { token: makeToken(), name: DEMO.name, email: DEMO.email, expires: Date.now() + IDLE_MS };
      sessionStorage.setItem(KEY, JSON.stringify(s));
      setSession(s);
      return { ok: true };
    }
    attempts.current += 1;
    if (attempts.current >= MAX_ATTEMPTS) {
      attempts.current = 0;
      lockedUntil.current = Date.now() + LOCK_SEC * 1000;
      return { ok: false, locked: LOCK_SEC };
    }
    return { ok: false, form: 'Невірний email або пароль', left: MAX_ATTEMPTS - attempts.current };
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(KEY);
    setSession(null);
  }, []);

  useEffect(() => {
    if (!session) return undefined;
    let expires = Date.now() + IDLE_MS;
    const touch = () => {
      expires = Date.now() + IDLE_MS;
    };
    const events = ['click', 'keydown', 'pointermove'];
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    const id = setInterval(() => {
      if (Date.now() > expires) logout();
    }, 15000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, touch));
      clearInterval(id);
    };
  }, [session, logout]);

  const value = useMemo(
    () => ({
      user: session ? { name: session.name, email: session.email } : null,
      login,
      logout,
    }),
    [session, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
