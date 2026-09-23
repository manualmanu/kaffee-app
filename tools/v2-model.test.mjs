import test from 'node:test';
import assert from 'node:assert/strict';
import { clone, emptyData, id, makeBrew, newRecipe, parseBackup, ratio, scaleRecipe, setRatio, setWater, validateData, validateRecipe } from '../src/v2/model.js';
import { createStore, LEGACY_KEY, STORAGE_KEY } from '../src/v2/store.js';

function recipe(method = 'iced') {
  return { ...newRecipe(method), name: 'Aus dem Video', coffee: 19, water: method === 'iced' ? 120 : 220,
    ice: method === 'iced' ? 100 : 0, grind: 24, temperature: 94,
    steps: method === 'coldbrew' ? [] : [
      { id: id(), name: 'Blooming', amount: 40, timing: { kind: 'duration', seconds: 30 } },
      { id: id(), name: 'Aufguss', amount: method === 'iced' ? 80 : 180, timing: { kind: 'at', seconds: 45 } },
    ] };
}
function memory(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
test('220 → 330 scales ingredients and pours, preserving times and settings', () => {
  const original = recipe();
  const scaled = scaleRecipe(original, 330);
  assert.equal(scaled.coffee, 28.5); assert.equal(scaled.water, 180); assert.equal(scaled.ice, 150);
  assert.deepEqual(scaled.steps.map(s => s.amount), [60, 120]);
  assert.equal(scaled.steps[0].timing.seconds, 30); assert.equal(scaled.grind, 24); assert.equal(scaled.temperature, 94);
  assert.equal(original.water, 120); validateRecipe(scaled);
});
test('ratio includes ice and changes only coffee', () => {
  const r = recipe(); setRatio(r, 15);
  assert.equal(r.coffee, 220 / 15); assert.equal(r.water, 120); assert.equal(r.ice, 100); assert.equal(ratio(r), 15);
});
test('changing water scales existing steps', () => {
  const r = recipe(); setWater(r, 240);
  assert.deepEqual(r.steps.map(s => s.amount), [80, 160]); validateRecipe(r);
});
test('repeated scaling retains unrounded precision', () => {
  const r = recipe(); const scaled = scaleRecipe(scaleRecipe(r, 333), 220);
  assert.ok(Math.abs(scaled.coffee - 19) < 1e-10);
});
test('cold brew is ready-to-drink with optional steep range and no pours', () => {
  const r = recipe('coldbrew'); r.steepMin = 12; r.steepMax = 16;
  const scaled = scaleRecipe(r, 1000);
  assert.equal(scaled.water, 1000); assert.equal(scaled.ice, 0); assert.equal(scaled.steepMax, 16); validateRecipe(scaled);
});
test('recipes can omit optional settings and all steps', () => {
  const r = newRecipe('pourover'); r.name = 'Einfach'; validateRecipe(r);
});
test('rejects invalid ingredient totals, times, source protocols and method fields', () => {
  for (const mutate of [r => r.coffee = 0, r => r.water = NaN, r => r.ice = -1,
    r => r.steps[1].amount = 1000, r => r.steps[0].amount = -1,
    r => r.source = 'javascript:alert(1)', r => r.temperature = 200,
    r => r.steps[0].timing.seconds = -1,
    r => { r.steps[0].timing = { kind: 'at', seconds: 60 }; },
    r => { r.method = 'pourover'; }, r => r.method = 'toString']) {
    const r = recipe(); mutate(r); assert.throws(() => validateRecipe(r));
  }
  assert.throws(() => scaleRecipe(recipe(), 0));
  assert.throws(() => setRatio(recipe(), Infinity));
});
test('cold brew cannot contain incompatible pour and brew fields', () => {
  const r = recipe('coldbrew'); r.brewSeconds = 120; assert.throws(() => validateRecipe(r));
  r.brewSeconds = null; r.steepMin = 16; r.steepMax = 12; assert.throws(() => validateRecipe(r));
});
test('completed brew snapshots never share recipe or bean references', () => {
  const r = recipe(); const bean = { id: id(), name: 'Ethiopia', processing: 'Washed', roaster: '', roastDate: '', notes: '', archived: false };
  const brew = makeBrew(r, bean); r.grind = 22; r.steps[0].amount = 20; bean.archived = true; bean.processing = 'Natural';
  assert.equal(brew.recipe.grind, 24); assert.equal(brew.recipe.steps[0].amount, 40); assert.equal(brew.bean.archived, false); assert.equal(brew.bean.processing, 'Washed');
  assert.deepEqual(brew.rating, { overall: null, acidity: null, bitterness: null, note: '' });
});
test('versioned backup roundtrip retains archived beans and unrated / rated brews', () => {
  const data = emptyData(); const r = recipe();
  const bean = { id: id(), name: 'Ethiopia', processing: 'Anaerobic fermented', roaster: 'Röster', roastDate: '2026-08-20', notes: '', archived: true };
  data.recipes.push(r); data.beans.push(bean); data.brews.push(makeBrew(r), makeBrew(r, bean));
  data.brews[1].rating = { overall: 'gut', acidity: 'passend', bitterness: 'zu viel', note: 'Nächstes Mal gröber' };
  assert.deepEqual(parseBackup(JSON.stringify(data)), data);
});
test('malformed backup versions, nested data, dates, duplicate IDs and missing references fail', () => {
  const valid = emptyData(); valid.recipes.push(recipe()); valid.brews.push(makeBrew(valid.recipes[0]));
  for (const mutate of [d => d.version = 1, d => d.recipes.push(clone(d.recipes[0])), d => d.brews[0].rating.acidity = 'stark',
    d => d.brews[0].completedAt = 'garbage', d => d.brews[0].recipeId = 'missing', d => d.brews[0].recipe.water = '120',
    d => d.beans = null, d => d.brews[0].bean = {}]) {
    const d = clone(valid); mutate(d); assert.throws(() => validateData(d));
  }
});
test('legacy data stays untouched until explicit restart', () => {
  const storage = memory({ [LEGACY_KEY]: '{"version":1}' }); const store = createStore(storage);
  assert.equal(store.legacy, true); assert.equal(storage.getItem(STORAGE_KEY), null);
  assert.throws(() => store.change(d => d.recipes.push(recipe())));
  store.restart(); assert.equal(storage.getItem(LEGACY_KEY), null); assert.equal(store.legacy, false);
  assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEY)), emptyData());
});
test('corrupt stored data is preserved and available for recovery export', () => {
  const storage = memory({ [STORAGE_KEY]: '{bad' }); const store = createStore(storage);
  assert.ok(store.problem); assert.equal(store.exportRaw(), '{bad'); assert.equal(storage.getItem(STORAGE_KEY), '{bad');
});
test('failed writes never change in-memory data or delete legacy data', () => {
  const storage = memory(); const store = createStore(storage);
  storage.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.throws(() => store.change(d => d.recipes.push(recipe())), /Speichern nicht möglich/);
  assert.deepEqual(store.data, emptyData());
  const legacyStorage = memory({ [LEGACY_KEY]: 'old' }); const legacyStore = createStore(legacyStorage);
  legacyStorage.setItem = storage.setItem;
  assert.throws(() => legacyStore.restart()); assert.equal(legacyStorage.getItem(LEGACY_KEY), 'old');
});
test('invalid import does not overwrite current data; valid import survives reload', () => {
  const storage = memory(); const store = createStore(storage); store.change(d => d.recipes.push(recipe()));
  const before = store.export(); assert.throws(() => store.import('{"version":2}')); assert.equal(store.export(), before);
  const next = emptyData(); next.recipes.push(recipe('coldbrew')); store.import(JSON.stringify(next));
  assert.deepEqual(createStore(storage).data, next);
});
test('returned store objects cannot mutate durable state', () => {
  const store = createStore(memory()); store.change(d => d.recipes.push(recipe()));
  store.data.recipes[0].name = 'Changed externally'; assert.equal(store.data.recipes[0].name, 'Aus dem Video');
});
test('a stale browser window cannot silently overwrite another window', () => {
  const storage = memory(); const a = createStore(storage); const b = createStore(storage);
  a.change(d => d.recipes.push(recipe()));
  assert.throws(() => b.change(d => d.recipes.push(recipe('coldbrew'))), /anderen Fenster/);
  assert.equal(createStore(storage).data.recipes[0].method, 'iced');
});
