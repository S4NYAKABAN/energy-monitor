import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  round,
  sum,
  average,
  calcCost,
  estimateRuntime,
  formatHours,
  batteryLevel,
  selfSufficiency,
  peakRow,
  sortBy,
} from './energy.js';
import { toCsv } from './csv.js';

test('round', () => {
  assert.equal(round(1.005, 2), 1.01);
  assert.equal(round(2.5, 0), 3);
});

test('sum and average', () => {
  assert.equal(sum([1, 2, 3]), 6);
  assert.equal(sum([]), 0);
  assert.equal(average([2, 4]), 3);
  assert.equal(average([]), 0);
});

test('calcCost', () => {
  assert.equal(calcCost(10, 4.32), 43.2);
  assert.equal(calcCost(0, 4.32), 0);
});

test('estimateRuntime', () => {
  assert.equal(estimateRuntime(10, 80, 1, 20), 6);
  assert.equal(estimateRuntime(10, 15, 1, 20), 0);
  assert.equal(estimateRuntime(10, 80, 0), Infinity);
});

test('formatHours', () => {
  assert.equal(formatHours(2.5), '2 год 30 хв');
  assert.equal(formatHours(0.5), '30 хв');
  assert.equal(formatHours(3), '3 год');
  assert.equal(formatHours(72), '3 діб');
  assert.equal(formatHours(Infinity), 'необмежено');
});

test('batteryLevel', () => {
  assert.equal(batteryLevel(80, 20), 'ok');
  assert.equal(batteryLevel(20, 20), 'low');
  assert.equal(batteryLevel(10, 20), 'critical');
});

test('selfSufficiency', () => {
  const rows = [
    { consumption: 2, generation: 1 },
    { consumption: 2, generation: 5 },
  ];
  assert.equal(selfSufficiency(rows), 75);
  assert.equal(selfSufficiency([]), 0);
});

test('peakRow', () => {
  const rows = [
    { label: 'a', consumption: 1 },
    { label: 'b', consumption: 3 },
  ];
  assert.equal(peakRow(rows).label, 'b');
  assert.equal(peakRow([]), null);
});

test('sortBy', () => {
  const rows = [{ n: 2, s: 'б' }, { n: 1, s: 'а' }, { n: 3, s: 'в' }];
  assert.deepEqual(sortBy(rows, 'n').map((r) => r.n), [1, 2, 3]);
  assert.deepEqual(sortBy(rows, 'n', 'desc').map((r) => r.n), [3, 2, 1]);
  assert.deepEqual(sortBy(rows, 's').map((r) => r.s), ['а', 'б', 'в']);
});

test('toCsv escaping', () => {
  const cols = [{ key: 'a', title: 'A' }, { key: 'b', title: 'B' }];
  const csv = toCsv([{ a: 'x;y', b: 'say "hi"' }], cols);
  assert.equal(csv, 'A;B\r\n"x;y";"say ""hi"""');
});

test('toCsv formula guard', () => {
  const cols = [{ key: 'a', title: 'A' }];
  assert.equal(toCsv([{ a: '=SUM(A1)' }], cols), "A\r\n'=SUM(A1)");
  assert.equal(toCsv([{ a: -3.5 }], cols), 'A\r\n-3,5');
});

test('toCsv decimal comma', () => {
  const cols = [{ key: 'a', title: 'A' }];
  assert.equal(toCsv([{ a: 1.14 }], cols), 'A\r\n1,14');
  assert.equal(toCsv([{ a: 1.14 }], cols, ';', '.'), 'A\r\n1.14');
});
