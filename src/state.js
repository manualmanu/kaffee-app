import { STORAGE_KEY } from './constants.js';
import { seedBohnen, seedRezeptVarianten } from './seedData.js';
import { genId, nowIso } from './id.js';

function isValidShape(d) {
  return d && Array.isArray(d.bohnen) && Array.isArray(d.rezeptVarianten)
    && Array.isArray(d.bohneVarianteEinstellungen) && Array.isArray(d.tastings);
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isValidShape(parsed)) return parsed;
      console.error('Gespeicherte Daten haben ein ungültiges Format, falle auf Seed-Daten zurück.');
    }
  } catch (e) { console.error('Fehler beim Laden aus localStorage:', e); }
  const seeded = {
    version: 1,
    rezeptVarianten: seedRezeptVarianten(),
    bohnen: seedBohnen(),
    bohneVarianteEinstellungen: [],
    tastings: [],
  };
  persist(seeded);
  return seeded;
}

function persist(d) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch (e) { console.error('Fehler beim Speichern in localStorage:', e); }
}

let data = load();

function save() { persist(data); }

export function getData() { return data; }

// — Bohnen —
export function getBohnen() { return data.bohnen; }
export function getBohne(id) { return data.bohnen.find(b => b.id === id); }
export function addBohne(fields) {
  const b = { id: genId(), roestdatum: null, notizen: null, ...fields, erstelltAm: nowIso(), aktualisiertAm: nowIso() };
  data.bohnen.push(b);
  save();
  return b;
}
export function updateBohne(id, fields) {
  const b = getBohne(id);
  if (!b) return null;
  Object.assign(b, fields, { aktualisiertAm: nowIso() });
  save();
  return b;
}
export function deleteBohne(id) {
  data.bohnen = data.bohnen.filter(b => b.id !== id);
  data.bohneVarianteEinstellungen = data.bohneVarianteEinstellungen.filter(e => e.bohneId !== id);
  save();
}

// — Rezept-Varianten —
export function getRezeptVarianten() { return data.rezeptVarianten; }
export function getVariantenByKategorie(kategorie) { return data.rezeptVarianten.filter(v => v.kategorie === kategorie); }
export function getVariante(id) { return data.rezeptVarianten.find(v => v.id === id); }
export function addVariante(fields) {
  const v = { id: genId(), ...fields, erstelltAm: nowIso(), aktualisiertAm: nowIso() };
  data.rezeptVarianten.push(v);
  save();
  return v;
}
export function updateVariante(id, fields) {
  const v = getVariante(id);
  if (!v) return null;
  Object.assign(v, fields, { aktualisiertAm: nowIso() });
  save();
  return v;
}
export function deleteVariante(id) {
  data.rezeptVarianten = data.rezeptVarianten.filter(v => v.id !== id);
  data.bohneVarianteEinstellungen = data.bohneVarianteEinstellungen.filter(e => e.varianteId !== id);
  save();
}

// — Bohne-Variante-Einstellung —
export function getEinstellung(bohneId, varianteId) {
  return data.bohneVarianteEinstellungen.find(e => e.bohneId === bohneId && e.varianteId === varianteId);
}
export function getEffektiverMahlgrad(bohneId, varianteId) {
  const einstellung = getEinstellung(bohneId, varianteId);
  if (einstellung) return { ...einstellung.mahlgrad, istStandard: false };
  const variante = getVariante(varianteId);
  return variante ? { ...variante.mahlgrad, istStandard: true } : null;
}
export function upsertEinstellung(bohneId, varianteId, mahlgrad) {
  let e = getEinstellung(bohneId, varianteId);
  if (e) {
    e.mahlgrad = mahlgrad;
    e.aktualisiertAm = nowIso();
  } else {
    e = { id: genId(), bohneId, varianteId, mahlgrad, aktualisiertAm: nowIso() };
    data.bohneVarianteEinstellungen.push(e);
  }
  save();
  return e;
}

// — Tastings —
export function getTastings() { return data.tastings; }
export function getTastingsFor(bohneId, varianteId) {
  return data.tastings
    .filter(t => t.bohneId === bohneId && t.varianteId === varianteId)
    .sort((a, b) => b.datum.localeCompare(a.datum));
}
export function getLetztesTastingFuerVariante(bohneId, varianteId) {
  return getTastingsFor(bohneId, varianteId)[0] || null;
}
export function getVariantenUebersichtFuerBohne(bohneId) {
  const tastingsForBean = data.tastings.filter(t => t.bohneId === bohneId);
  const byVariante = new Map();
  for (const t of tastingsForBean) {
    const prev = byVariante.get(t.varianteId);
    if (!prev || prev.datum < t.datum) byVariante.set(t.varianteId, t);
  }
  return Array.from(byVariante.values())
    .sort((a, b) => b.datum.localeCompare(a.datum))
    .map(letztesTasting => ({ varianteId: letztesTasting.varianteId, varianteName: letztesTasting.varianteName, letztesTasting }));
}
export function addTasting(fields) {
  const t = { id: genId(), datum: nowIso(), ...fields };
  data.tastings.unshift(t);
  save();
  return t;
}

// — Export/Import —
export function exportJson() {
  return JSON.stringify(data, null, 2);
}
export function importJson(json) {
  const parsed = JSON.parse(json);
  if (!parsed || !Array.isArray(parsed.bohnen) || !Array.isArray(parsed.rezeptVarianten)) {
    throw new Error('Ungültiges Backup-Format');
  }
  data = {
    version: 1,
    rezeptVarianten: parsed.rezeptVarianten || [],
    bohnen: parsed.bohnen || [],
    bohneVarianteEinstellungen: parsed.bohneVarianteEinstellungen || [],
    tastings: parsed.tastings || [],
  };
  save();
  return data;
}
