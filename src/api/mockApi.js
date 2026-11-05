import { round, sum } from '../utils/energy.js';

const wait = (ms = 450, jitter = 250) => new Promise((r) => setTimeout(r, ms + Math.random() * jitter));
const pad = (n) => String(n).padStart(2, '0');
const DAYS = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const CAPACITY = 15;

function rng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dayProfile() {
  const r = rng(42);
  const rows = [];
  let soc = 62;
  for (let h = 0; h < 24; h++) {
    const morning = Math.exp(-((h - 7.5) ** 2) / 3) * 0.7;
    const evening = Math.exp(-((h - 20) ** 2) / 6) * 1.5;
    const consumption = round(0.45 + morning + evening + r() * 0.25, 2);
    const sun = h >= 6 && h <= 19 ? Math.sin(((h - 6) / 13) * Math.PI) : 0;
    const generation = round(sun * 3.4 * (0.8 + r() * 0.2), 2);
    soc = Math.min(100, Math.max(10, soc + ((generation - consumption) / CAPACITY) * 100));
    rows.push({ label: `${pad(h)}:00`, consumption, generation, soc: round(soc, 0) });
  }
  return rows;
}

const PROFILE = dayProfile();

let version = 0;
const listeners = new Set();
const bump = () => {
  version += 1;
  listeners.forEach((l) => l());
};
export const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const getVersion = () => version;

let devices = [
  { id: 'fridge', name: 'Холодильник', zone: 'Кухня', rated: 0.15, daily: 2.1, on: true, critical: true },
  { id: 'heating', name: 'Електроопалення', zone: 'Будинок', rated: 2.4, daily: 7.5, on: true, critical: false },
  { id: 'light', name: 'Освітлення', zone: 'Будинок', rated: 0.3, daily: 1.9, on: true, critical: false },
  { id: 'boiler', name: 'Бойлер', zone: 'Ванна', rated: 2.0, daily: 3.4, on: true, critical: false },
  { id: 'ac', name: 'Кондиціонер', zone: 'Вітальня', rated: 1.2, daily: 2.6, on: false, critical: false },
  { id: 'ev', name: 'Зарядка EV', zone: 'Гараж', rated: 3.3, daily: 0, on: false, critical: false },
  { id: 'pump', name: 'Насос водопостачання', zone: 'Технічна', rated: 0.5, daily: 1.1, on: true, critical: true },
  { id: 'net', name: 'Мережеве обладнання', zone: 'Кабінет', rated: 0.06, daily: 1.5, on: true, critical: true },
];

const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString();

let alerts = [
  { id: 1, level: 'critical', title: 'Низький заряд АКБ', text: 'Заряд батареї опустився нижче 15 %. Рекомендовано обмежити навантаження.', time: hoursAgo(5), ack: false },
  { id: 2, level: 'warning', title: 'Перевищено потужність', text: 'Навантаження перевищило 80 % номінальної потужності інвертора.', time: hoursAgo(9), ack: false },
  { id: 3, level: 'warning', title: 'Висока температура АКБ', text: 'Температура батареї досягла 38 °C у денний час.', time: hoursAgo(26), ack: false },
  { id: 4, level: 'info', title: 'Перехід на живлення від СЕС', text: 'Систему переключено на сонячну генерацію.', time: hoursAgo(30), ack: true },
  { id: 5, level: 'info', title: 'Оновлено прошивку інвертора', text: 'Встановлено версію 2.4.1, перезавантаження не потрібне.', time: hoursAgo(72), ack: true },
];

export const getUnackCount = () => alerts.filter((a) => !a.ack).length;

export async function getOverview() {
  await wait();
  const h = new Date().getHours();
  const row = PROFILE[h];
  const upto = PROFILE.slice(0, h + 1);
  let mode = 'grid';
  if (row.generation >= row.consumption) mode = 'solar';
  else if (row.soc > 20) mode = 'battery';
  return {
    power: row.consumption,
    generation: row.generation,
    consumedToday: round(sum(upto.map((r) => r.consumption)), 1),
    generatedToday: round(sum(upto.map((r) => r.generation)), 1),
    soc: row.soc,
    mode,
  };
}

export async function getBattery() {
  const o = await getOverview();
  const diff = o.generation - o.power;
  let status = 'idle';
  if (o.mode === 'solar' && diff > 0) status = 'charging';
  else if (o.mode === 'battery') status = 'discharging';
  return {
    capacity: CAPACITY,
    soc: o.soc,
    voltage: round(48 + (o.soc / 100) * 6, 1),
    current: round((diff * 1000) / 51.2, 1),
    temperature: round(24 + o.generation * 1.2, 1),
    cycles: 412,
    health: 96,
    status,
    mode: o.mode,
    generation: o.generation,
    power: o.power,
    inverter: {
      outputVoltage: 230.4,
      frequency: 50.0,
      loadPercent: Math.round((o.power / 5) * 100),
    },
  };
}

export async function getSeries(range) {
  await wait(350);
  if (range === 'day') return PROFILE.map((r) => ({ ...r }));
  const count = range === 'week' ? 7 : 30;
  const rows = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const r = rng(100 + i);
    const date = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;
    rows.push({
      label: range === 'week' ? `${DAYS[d.getDay()]} ${date}` : date,
      consumption: round(14 + r() * 8, 1),
      generation: round(6 + r() * 14, 1),
      soc: Math.round(40 + r() * 50),
    });
  }
  return rows;
}

export async function getDevices() {
  await wait(120, 80);
  return devices.map((d) => ({ ...d }));
}

export async function toggleDevice(id) {
  await wait(60, 40);
  devices = devices.map((d) => (d.id === id ? { ...d, on: !d.on } : d));
  bump();
}

export async function getAlerts() {
  await wait(120, 80);
  return alerts.map((a) => ({ ...a }));
}

export async function ackAlert(id) {
  await wait(60, 40);
  alerts = alerts.map((a) => (a.id === id ? { ...a, ack: true } : a));
  bump();
}

export async function ackAllAlerts() {
  await wait(60, 40);
  alerts = alerts.map((a) => ({ ...a, ack: true }));
  bump();
}
