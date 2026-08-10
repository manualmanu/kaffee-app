export function fmt(n) {
  if (n == null || isNaN(n)) return '–';
  const r = Math.round(n * 2) / 2;
  return (r % 1 === 0) ? String(r) : r.toFixed(1);
}

export function fmtZeitMMSS(sek) {
  if (sek == null) return '–';
  const m = Math.floor(sek / 60);
  const s = Math.round(sek % 60);
  return m + ':' + String(s).padStart(2, '0');
}

export function fmtZeitRange(von, bis) {
  if (von == null || bis == null) return '–';
  return `${fmtZeitMMSS(von)}–${fmtZeitMMSS(bis)} Min`;
}

export function fmtStundenRange(vonSek, bisSek) {
  if (vonSek == null || bisSek == null) return '–';
  return `${Math.round(vonSek / 3600)}–${Math.round(bisSek / 3600)} Std.`;
}

export function fmtDatum(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit' })
    + ' · ' + d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
}
