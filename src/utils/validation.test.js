import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateLogin, validateSettings, validateLoad, sanitizeText } from './validation.js';

test('login valid', () => {
  assert.deepEqual(validateLogin({ email: 'a@b.ua', password: 'Energy2026!' }), {});
});

test('login empty', () => {
  const e = validateLogin({ email: '', password: '' });
  assert.ok(e.email && e.password);
});

test('login bad email and short password', () => {
  const e = validateLogin({ email: 'abc', password: '123' });
  assert.match(e.email, /формат/);
  assert.match(e.password, /8/);
});

test('settings valid with comma decimal', () => {
  const { errors, values } = validateSettings({
    tariff: '4,32',
    threshold: '20',
    capacity: '10',
    notify: true,
    theme: 'dark',
  });
  assert.deepEqual(errors, {});
  assert.equal(values.tariff, 4.32);
  assert.equal(values.theme, 'dark');
});

test('settings invalid', () => {
  const { errors } = validateSettings({ tariff: '0', threshold: '3.5', capacity: 'abc' });
  assert.ok(errors.tariff && errors.threshold && errors.capacity);
});

test('settings unknown theme falls back', () => {
  const { values } = validateSettings({ tariff: 4, threshold: 20, capacity: 10, theme: 'x' });
  assert.equal(values.theme, 'system');
});

test('load', () => {
  assert.equal(validateLoad('1,5').value, 1.5);
  assert.equal(validateLoad('').ok, false);
  assert.equal(validateLoad('abc').ok, false);
  assert.equal(validateLoad('0.01').ok, false);
  assert.equal(validateLoad('25').ok, false);
});

test('sanitizeText', () => {
  assert.equal(sanitizeText('  <b>hi</b>  '), 'bhi/b');
  assert.equal(sanitizeText('a'.repeat(100), 10).length, 10);
  assert.equal(sanitizeText(null), '');
});
