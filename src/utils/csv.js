function cell(value, sep, dec) {
  let s = value === null || value === undefined ? '' : String(value);
  if (typeof value === 'number' && dec !== '.') s = s.replace('.', dec);
  if (typeof value === 'string' && /^[=+\-@]/.test(s)) s = `'${s}`;
  if (s.includes('"') || s.includes('\n') || s.includes('\r') || s.includes(sep)) {
    s = `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv(rows, columns, sep = ';', dec = ',') {
  const head = columns.map((c) => cell(c.title, sep, dec)).join(sep);
  const body = rows.map((r) => columns.map((c) => cell(r[c.key], sep, dec)).join(sep));
  return [head, ...body].join('\r\n');
}

export function downloadCsv(filename, text) {
  const blob = new Blob(['﻿', text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
