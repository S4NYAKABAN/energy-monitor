const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const num = (v) => Number(String(v).replace(',', '.').trim());

export function validateLogin({ email, password }) {
  const errors = {};
  const mail = String(email ?? '').trim();
  const pass = String(password ?? '');
  if (!mail) errors.email = 'Введіть email';
  else if (mail.length > 254 || !EMAIL.test(mail)) errors.email = 'Невірний формат email';
  if (!pass) errors.password = 'Введіть пароль';
  else if (pass.length < 8) errors.password = 'Пароль містить мінімум 8 символів';
  else if (pass.length > 128) errors.password = 'Пароль задовгий';
  return errors;
}

export function validateSettings(raw) {
  const errors = {};
  const values = {};

  const tariff = num(raw.tariff);
  if (!Number.isFinite(tariff) || tariff < 0.1 || tariff > 100) {
    errors.tariff = 'Тариф: від 0,1 до 100 грн/кВт·год';
  } else values.tariff = tariff;

  const threshold = num(raw.threshold);
  if (!Number.isInteger(threshold) || threshold < 5 || threshold > 90) {
    errors.threshold = 'Поріг: ціле число від 5 до 90 %';
  } else values.threshold = threshold;

  const capacity = num(raw.capacity);
  if (!Number.isFinite(capacity) || capacity < 1 || capacity > 200) {
    errors.capacity = 'Ємність: від 1 до 200 кВт·год';
  } else values.capacity = capacity;

  values.notify = Boolean(raw.notify);
  values.theme = ['light', 'dark', 'system'].includes(raw.theme) ? raw.theme : 'system';
  return { errors, values };
}

export function validateLoad(input) {
  const text = String(input ?? '').trim();
  if (!text) return { ok: false, error: 'Введіть потужність навантаження' };
  const value = num(text);
  if (!Number.isFinite(value)) return { ok: false, error: 'Введіть число' };
  if (value < 0.05 || value > 20) return { ok: false, error: 'Допустимо від 0,05 до 20 кВт' };
  return { ok: true, value };
}

export function sanitizeText(text, max = 60) {
  return String(text ?? '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, max);
}
