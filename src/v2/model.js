// All amounts are weights in grams. Display rounding never changes stored values.
export const VERSION = 2;
export const METHODS = {
  pourover: { label: 'Pour Over', description: 'Heisses Wasser, in deinem Rhythmus.', mark: '01' },
  iced: { label: 'Pour Over Ice', description: 'Heiss gebrüht. Auf Eis gekühlt.', mark: '02' },
  coldbrew: { label: 'Cold Brew', description: 'Kalt ziehen lassen, trinkfertig geniessen.', mark: '03' },
};
export const clone = value => structuredClone(value);
export const id = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
export const total = recipe => recipe.water + recipe.ice;
export const ratio = recipe => total(recipe) / recipe.coffee;
export const emptyData = () => ({ version: VERSION, recipes: [], beans: [], brews: [] });
export const emptyRating = () => ({ overall: null, acidity: null, bitterness: null, note: '' });
export function newRecipe(method) {
  return { id: id(), name: '', method, source: '', notes: '', coffee: 20,
    water: method === 'iced' ? 180 : 300, ice: method === 'iced' ? 120 : 0,
    grind: null, grindUnit: 'Klicks', temperature: null, brewSeconds: null,
    steepMin: null, steepMax: null, steps: [] };
}
export function scaleRecipe(recipe, target) {
  if (!Number.isFinite(target) || target <= 0 || total(recipe) <= 0) throw new Error('Bitte eine positive Zielmenge eingeben.');
  const result = clone(recipe);
  const factor = target / total(recipe);
  for (const key of ['coffee', 'water', 'ice']) result[key] *= factor;
  result.water = target - result.ice;
  result.steps.forEach(step => { step.amount *= factor; });
  return result;
}
export function setWater(recipe, water) {
  const factor = recipe.water > 0 ? water / recipe.water : 1;
  recipe.steps.forEach(step => { step.amount *= factor; });
  recipe.water = water;
}
export function setRatio(recipe, value) {
  if (!Number.isFinite(value) || value <= 0) throw new Error('Das Verhältnis muss grösser als null sein.');
  recipe.coffee = total(recipe) / value;
}
export function cumulativeSteps(recipe) {
  let cumulative = 0;
  return recipe.steps.map(step => ({ ...step, cumulative: cumulative += step.amount }));
}

const text = value => typeof value === 'string';
const positive = value => Number.isFinite(value) && value > 0;
const nonnegative = value => Number.isFinite(value) && value >= 0;
const optional = (value, check) => value === null || check(value);
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const validId = value => text(value) && value.length > 0 && value.length <= 200;
const validDate = value => text(value) && Number.isFinite(Date.parse(value));

export function validateRecipe(r) {
  assert(r && validId(r.id) && text(r.name) && r.name.trim(), 'Bitte einen Rezeptnamen eingeben.');
  assert(Object.hasOwn(METHODS, r.method), 'Unbekannte Zubereitungsmethode.');
  assert(text(r.source) && text(r.notes), 'Quelle oder Notizen sind ungültig.');
  if (r.source) {
    let url;
    try { url = new URL(r.source); } catch { throw new Error('Bitte einen vollständigen Quellenlink mit https:// eingeben.'); }
    assert(['https:', 'http:'].includes(url.protocol), 'Als Quelle sind nur Webseitenlinks erlaubt.');
  }
  assert(positive(r.coffee) && positive(r.water) && nonnegative(r.ice), 'Kaffee und Wasser müssen grösser als null sein; Eis darf nicht negativ sein.');
  assert(positive(total(r)) && positive(ratio(r)), 'Die Mengen oder das Verhältnis sind zu gross oder zu klein.');
  assert(r.method === 'iced' || r.ice === 0, 'Eis ist nur bei Pour Over Ice vorgesehen.');
  assert(optional(r.grind, nonnegative) && text(r.grindUnit) && r.grindUnit.trim(), 'Mahlgrad oder Einheit sind ungültig.');
  assert(optional(r.temperature, n => positive(n) && n <= 100), 'Die Temperatur muss zwischen 0 und 100 °C liegen.');
  assert(optional(r.brewSeconds, positive), 'Die Brühzeit muss positiv sein.');
  assert(optional(r.steepMin, positive) && optional(r.steepMax, positive), 'Die Ziehzeit muss positiv sein.');
  assert(r.steepMax === null || (r.steepMin !== null && r.steepMax >= r.steepMin), 'Die maximale Ziehzeit darf nicht unter der minimalen liegen.');
  assert(Array.isArray(r.steps), 'Ungültige Rezeptschritte.');
  assert(r.method !== 'coldbrew' || (r.steps.length === 0 && r.brewSeconds === null), 'Cold Brew verwendet eine Ziehzeit statt Aufgüssen.');
  assert(r.method === 'coldbrew' || (r.steepMin === null && r.steepMax === null), 'Ziehzeiten in Stunden gehören zu Cold Brew.');
  let previousAt = -1;
  const ids = new Set();
  for (const step of r.steps) {
    assert(step && validId(step.id) && !ids.has(step.id), 'Ungültige oder doppelte Schritt-ID.');
    ids.add(step.id);
    assert(text(step.name) && step.name.trim() && positive(step.amount), 'Jeder Schritt braucht einen Namen und eine positive Wassermenge.');
    assert(step.timing === null || (step.timing && ['at', 'duration'].includes(step.timing.kind) && nonnegative(step.timing.seconds)), 'Ungültige Zeitangabe im Schritt.');
    if (step.timing?.kind === 'at') {
      assert(step.timing.seconds >= previousAt, 'Zeitpunkte ab Start müssen in aufsteigender Reihenfolge stehen.');
      previousAt = step.timing.seconds;
    }
  }
  if (r.steps.length) {
    const sum = r.steps.reduce((n, step) => n + step.amount, 0);
    assert(Math.abs(sum - r.water) <= Math.max(0.001, r.water * 1e-9), 'Die Aufgüsse inklusive Blooming müssen zusammen die Wassermenge ergeben.');
  }
  return r;
}

export function validateBean(bean) {
  assert(bean && validId(bean.id) && text(bean.name) && bean.name.trim(), 'Bitte einen Bohnennamen eingeben.');
  assert(['roaster', 'processing', 'notes', 'roastDate'].every(k => text(bean[k])) && typeof bean.archived === 'boolean', 'Ungültige Bohnenangaben.');
  if (bean.roastDate) {
    assert(/^\d{4}-\d{2}-\d{2}$/.test(bean.roastDate) && validDate(bean.roastDate)
      && new Date(bean.roastDate).toISOString().slice(0, 10) === bean.roastDate, 'Ungültiges Röstdatum.');
  }
  return bean;
}
export function validateRating(rating) {
  assert(rating && [null, 'gut', 'mittel', 'schlecht'].includes(rating.overall), 'Ungültiges Gesamturteil.');
  for (const key of ['acidity', 'bitterness']) assert([null, 'zu wenig', 'passend', 'zu viel'].includes(rating[key]), 'Ungültige Geschmacksbewertung.');
  assert(text(rating.note), 'Ungültige Bewertungsnotiz.');
}
export function validateData(data) {
  assert(data && data.version === VERSION, 'Dieses Backup hat ein nicht unterstütztes Format (erwartet: Version 2).');
  for (const key of ['recipes', 'beans', 'brews']) {
    assert(Array.isArray(data[key]), 'Das Backup ist unvollständig.');
    const ids = new Set();
    for (const item of data[key]) {
      assert(item && validId(item.id) && !ids.has(item.id), 'Das Backup enthält ungültige oder doppelte IDs.');
      ids.add(item.id);
    }
  }
  data.recipes.forEach(validateRecipe);
  data.beans.forEach(validateBean);
  for (const brew of data.brews) {
    assert(validDate(brew.completedAt), 'Ungültiges Datum eines Brühversuchs.');
    assert(data.recipes.some(r => r.id === brew.recipeId), 'Ein Versuch verweist auf ein fehlendes Rezept.');
    validateRecipe(brew.recipe);
    assert(brew.recipe.id === brew.recipeId, 'Rezept und Versuch passen nicht zusammen.');
    if (brew.bean !== null) {
      validateBean(brew.bean);
      assert(data.beans.some(b => b.id === brew.bean.id), 'Ein Versuch verweist auf eine fehlende Bohne.');
    }
    validateRating(brew.rating);
  }
  return data;
}

export function makeBrew(recipe, bean = null) {
  validateRecipe(recipe);
  if (bean) validateBean(bean);
  return { id: id(), recipeId: recipe.id, completedAt: now(), recipe: clone(recipe), bean: clone(bean), rating: emptyRating() };
}
export const parseBackup = json => clone(validateData(JSON.parse(json)));
