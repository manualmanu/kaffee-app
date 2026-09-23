import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';
import { emptyData, newRecipe } from '../src/v2/model.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
    const contents = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(contents);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('dialog', dialog => dialog.accept());
  const click = name => page.getByRole('button', { name, exact: true }).click();
  const heading = name => page.getByRole('heading', { level: 1, name, exact: true }).waitFor();
  const nav = name => page.getByRole('navigation').getByRole('button', { name, exact: true }).click();
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('kaffee_state_v2')));
  const shot = async (name, fullPage = true) => {
    await mkdir(path.join(root, 'tools/shots'), { recursive: true });
    await page.screenshot({ path: path.join(root, `tools/shots/v2-${name}.png`), fullPage });
  };
  await page.goto(base);
  await heading('Kaffee.');

  if (!process.argv.includes('--pwa')) {
    await shot('design-start', false);
    await page.getByRole('button', { name: /02 Pour Over Ice/ }).click();
    await click('+ Neu');
    await page.getByLabel('Rezeptname', { exact: true }).fill('Iced aus dem Video');
    await page.getByLabel('Quellenlink (optional)', { exact: true }).fill('https://example.com/rezept');
    await page.getByLabel('Kaffee (g)', { exact: true }).fill('19');
    await page.getByLabel('Kaffee (g)', { exact: true }).press('ArrowUp');
    assert.equal(await page.getByLabel('Kaffee (g)', { exact: true }).inputValue(), '19.1');
    await page.getByLabel('Kaffee (g)', { exact: true }).press('ArrowDown');
    assert.equal(await page.getByLabel('Kaffee (g)', { exact: true }).inputValue(), '19');
    await page.getByLabel('Wasser (g / ca. ml)', { exact: true }).fill('120');
    await page.getByLabel('Eis (g)', { exact: true }).fill('100');
    assert.equal(await page.getByLabel('Verhältnis 1 :', { exact: true }).inputValue(), '11.6');
    await page.getByLabel('Verhältnis 1 :', { exact: true }).fill('13');
    assert.equal(await page.getByLabel('Kaffee (g)', { exact: true }).inputValue(), '16.9');
    assert.equal(await page.getByLabel('Kaffee (g)', { exact: true }).evaluate(el => el.checkValidity()), true);
    await page.getByLabel('Kaffee (g)', { exact: true }).fill('19');
    await page.getByLabel('Mahlgrad (optional)', { exact: true }).fill('24');
    await page.getByLabel('Temperatur (°C, optional)', { exact: true }).fill('94');
    await click('+ Blooming');
    let step = page.getByRole('group', { name: 'Schritt 1', exact: true });
    await step.getByLabel('Wassermenge (g)', { exact: true }).fill('40');
    await step.getByLabel('Zeitangabe', { exact: true }).selectOption('duration');
    await step.getByLabel('Zeit (Sekunden)', { exact: true }).fill('30');
    await click('+ Aufguss');
    step = page.getByRole('group', { name: 'Schritt 2', exact: true });
    await step.getByLabel('Mengenangabe', { exact: true }).selectOption('total');
    assert.equal(await step.getByLabel('Wassermenge (g)', { exact: true }).inputValue(), '120');
    await step.getByLabel('Zeitangabe', { exact: true }).selectOption('at');
    await step.getByLabel('Zeit (Sekunden)', { exact: true }).fill('45');
    await click('Rezept speichern'); await heading('Iced aus dem Video');
    await page.getByLabel('Zielmenge (ml)', { exact: true }).fill('330');
    await page.getByLabel('Zielmenge (ml)', { exact: true }).press('ArrowUp');
    assert.equal(await page.getByLabel('Zielmenge (ml)', { exact: true }).inputValue(), '335');
    await page.getByLabel('Zielmenge (ml)', { exact: true }).press('ArrowDown');
    assert.equal(await page.getByLabel('Zielmenge (ml)', { exact: true }).inputValue(), '330');
    await click('5 ml mehr');
    assert.equal(await page.getByLabel('Zielmenge (ml)', { exact: true }).inputValue(), '335');
    await click('5 ml weniger');
    assert.equal(await page.getByLabel('Zielmenge (ml)', { exact: true }).inputValue(), '330');
    assert.equal(await page.locator('.stats dd').first().textContent(), '28.5 g');
    await page.getByText('60 g dazu → insgesamt 60 g Wasser', { exact: true }).waitFor();
    // A continuous slider interaction must not replace the control or lose focus.
    const slider = page.getByRole('slider');
    await slider.focus(); await slider.press('ArrowRight'); await slider.press('ArrowRight');
    assert.equal(await slider.inputValue(), '340');
    await page.getByLabel('Zielmenge (ml)', { exact: true }).fill('333');
    await page.getByLabel('Zielmenge (ml)', { exact: true }).press('Tab');
    assert.equal(await page.getByLabel('Zielmenge (ml)', { exact: true }).inputValue(), '335');
    await page.getByLabel('Zielmenge (ml)', { exact: true }).fill('330');
    await click('Timer starten');
    await page.waitForFunction(() => document.querySelector('.timer-value').textContent !== '00:00');
    await click('Timer pausieren');
    const paused = await page.locator('.timer-value').textContent();
    await page.waitForTimeout(1100); assert.equal(await page.locator('.timer-value').textContent(), paused);
    await click('Zurücksetzen'); assert.equal(await page.locator('.timer-value').textContent(), '00:00');
    await click('+ Bohne anlegen');
    await page.getByLabel('Bohnenname', { exact: true }).fill('Ethiopia Test');
    await page.getByLabel('Aufbereitung (optional)', { exact: true }).fill('Anaerobic fermented');
    await page.getByLabel('Röster (optional)', { exact: true }).fill('Test-Rösterei');
    await click('Bohne speichern'); await heading('Iced aus dem Video');
    assert.notEqual(await page.getByLabel('Bohnen wählen', { exact: true }).inputValue(), '');
    assert.equal(await page.getByLabel('Zielmenge (ml)', { exact: true }).inputValue(), '330');
    await shot('brew');
    await shot('design-brew', false);
    await page.locator('.timer').screenshot({ path: path.join(root, 'tools/shots/v2-design-timer.png') });
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    // Invalid controls inside collapsed settings must become visible on submit.
    await page.getByText('Einstellungen für diesen Versuch anpassen', { exact: true }).click();
    await page.getByLabel('Mahlgrad (optional)', { exact: true }).fill('-1');
    await page.getByText('Einstellungen für diesen Versuch anpassen', { exact: true }).click();
    await click('Fertig · Versuch speichern');
    assert.equal((await state()).brews.length, 0);
    assert.equal(await page.locator('details').getAttribute('open'), '');
    await page.getByLabel('Mahlgrad (optional)', { exact: true }).fill('24');
    await click('Fertig · Versuch speichern');
    await page.getByRole('heading', { name: 'Wie war dein Kaffee?' }).waitFor();
    await shot('design-rating', false);
    assert.equal(await page.locator('[aria-pressed="true"]').count(), 0);
    assert.equal((await state()).brews.length, 1);
    await click('Später bewerten');
    await page.locator('.list-card').first().click();
    await click('Diesen Versuch wiederholen');
    await page.getByText('Einstellungen für diesen Versuch anpassen', { exact: true }).click();
    await page.getByLabel('Mahlgrad (optional)', { exact: true }).fill('22');
    await page.getByText(/Mahlgrad: 22 statt 24/).waitFor();
    await click('Fertig · Versuch speichern');
    await page.getByRole('group', { name: 'Gesamturteil', exact: true }).getByRole('button', { name: 'gut', exact: true }).click();
    await page.getByRole('group', { name: 'Säure', exact: true }).getByRole('button', { name: 'passend', exact: true }).click();
    await page.getByRole('group', { name: 'Bitterkeit', exact: true }).getByRole('button', { name: 'zu viel', exact: true }).click();
    await page.getByLabel('Notiz (optional)', { exact: true }).fill('Nächstes Mal etwas gröber.');
    await click('Bewertung speichern');
    let data = await state();
    assert.equal(data.brews.length, 2); assert.equal(data.brews[0].recipe.grind, 22); assert.equal(data.brews[1].recipe.grind, 24);
    assert.equal(data.recipes[0].grind, 24); assert.equal(data.brews[0].rating.bitterness, 'zu viel');
    // Selecting a bean retains defaults until explicit reuse of its last attempt.
    await nav('Brühen'); await page.getByRole('button', { name: /02 Pour Over Ice/ }).click();
    await shot('design-recipes', false);
    await page.getByRole('button', { name: /Iced aus dem Video/ }).click();
    await page.getByLabel('Bohnen wählen', { exact: true }).selectOption(data.beans[0].id);
    assert.match(await page.locator('.stats').textContent(), /24 Klicks/);
    await click('Letzten Versuch übernehmen');
    assert.match(await page.locator('.stats').textContent(), /22 Klicks/);
    await click('Versuche');
    await heading('Versuche zum Rezept');
    await page.getByLabel('Gesamturteil filtern').selectOption('gut');
    assert.equal(await page.locator('.list-card').count(), 1);
    await page.getByLabel('Methode filtern').selectOption('coldbrew');
    assert.equal(await page.locator('.list-card').count(), 0);
    await page.getByLabel('Methode filtern').selectOption('');
    await page.getByLabel('Gesamturteil filtern').selectOption('');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    for (const width of [320, 1100, 390]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    await shot('history-filters');
    await page.locator('.list-card').first().click();
    await click('Diesen Versuch wiederholen');
    await click('Einstellungen ins Ausgangsrezept übernehmen');
    data = await state(); assert.equal(data.recipes[0].grind, 22); assert.equal(data.brews[1].recipe.grind, 24);
    await nav('Bohnen');
    await page.getByRole('button', { name: /Ethiopia Test/ }).click();
    await click('Bohne archivieren');
    assert.equal((await state()).beans[0].archived, true);
    assert.equal((await state()).brews[0].bean.archived, false);
    // Archived beans are absent from fresh preparation, but preserved in repeats.
    await nav('Brühen'); await page.getByRole('button', { name: /02 Pour Over Ice/ }).click();
    await page.getByRole('button', { name: /Iced aus dem Video/ }).click();
    assert.equal(await page.getByLabel('Bohnen wählen', { exact: true }).locator('option').count(), 1);
    await click('Fertig · Versuch speichern'); await click('Später bewerten');
    assert.equal((await state()).brews[0].bean, null);
    // Cold Brew uses a time range without a timer or pour editor.
    await nav('Brühen'); await page.getByRole('button', { name: /03 Cold Brew/ }).click(); await click('+ Neu');
    await page.getByLabel('Rezeptname', { exact: true }).fill('Cold Brew über Nacht');
    await page.getByLabel('Ziehzeit (Stunden)', { exact: true }).fill('12');
    await page.getByLabel('Bis (Stunden, optional)', { exact: true }).fill('16');
    assert.equal(await page.getByRole('button', { name: '+ Aufguss', exact: true }).count(), 0);
    await click('Rezept speichern');
    await page.getByText('12–16 Stunden', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Timer starten', exact: true }).count(), 0);
    await click('Fertig · Versuch speichern'); await click('Später bewerten');
    // Minimal ratio-only recipe, no bean, no steps, no mandatory tasting.
    await nav('Brühen'); await page.getByRole('button', { name: /01 Pour Over/ }).click(); await click('+ Neu');
    await page.getByLabel('Rezeptname', { exact: true }).fill('Pour Over einfach');
    await page.getByLabel('Wasser (g / ca. ml)', { exact: true }).fill('222');
    await page.getByLabel('Verhältnis 1 :', { exact: true }).fill('15');
    assert.equal(await page.getByLabel('Kaffee (g)', { exact: true }).inputValue(), '14.8');
    await click('Rezept speichern');
    assert.equal(await page.getByLabel('Zielmenge (ml)', { exact: true }).inputValue(), '222');
    const countBeforeFailure = (await state()).brews.length;
    await page.evaluate(() => {
      window.restoreStorageWrite = Storage.prototype.setItem;
      Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); };
    });
    await click('Fertig · Versuch speichern');
    await page.getByRole('alert').filter({ hasText: 'Speichern nicht möglich' }).waitFor();
    assert.equal((await state()).brews.length, countBeforeFailure);
    await page.evaluate(() => { Storage.prototype.setItem = window.restoreStorageWrite; delete window.restoreStorageWrite; });
    await click('Fertig · Versuch speichern'); await click('Später bewerten');
    assert.equal((await state()).brews[0].recipe.water, 222);
    // Backups roundtrip all entities and invalid imports leave data untouched.
    await nav('Daten');
    const before = await state();
    const downloaded = page.waitForEvent('download'); await click('Backup exportieren');
    const backup = JSON.parse(await readFile(await (await downloaded).path(), 'utf8'));
    assert.deepEqual(backup, before);
    await page.getByLabel('Backup-Datei', { exact: true }).setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"version":2}') });
    await page.getByRole('alert').waitFor(); assert.deepEqual(await state(), before);
    await page.getByLabel('Backup-Datei', { exact: true }).setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
    await heading('Kaffee.'); assert.deepEqual(await state(), before);
    await shot('home');
  } else {
    const data = emptyData(); const r = newRecipe('coldbrew'); r.name = 'Offline Cold Brew'; r.steepMin = 12; data.recipes.push(r);
    await page.evaluate(data => localStorage.setItem('kaffee_state_v2', JSON.stringify(data)), data);
    await page.reload();
  }
  // Await actual control, then reload entirely offline and use persisted recipes.
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const manifest = await page.evaluate(async () => (await fetch(document.querySelector('link[rel=manifest]').href)).json());
  assert.ok(manifest.icons.length);
  await context.setOffline(true); await page.reload(); await heading('Kaffee.');
  await page.getByRole('button', { name: /03 Cold Brew/ }).click();
  await page.getByRole('button', { name: /Cold Brew über Nacht|Offline Cold Brew/ }).click();
  await page.getByText(/12.*Stunden/).first().waitFor();
  await click('Fertig · Versuch speichern'); await click('Später bewerten');
  assert.deepEqual(errors, []);
  await context.setOffline(false);

  // Legacy and corruption recovery in independent browser storage.
  const legacyContext = await browser.newContext();
  await legacyContext.addInitScript(() => {
    if (!localStorage.getItem('seeded')) { localStorage.setItem('kaffee_state_v1', '{"version":1}'); localStorage.setItem('seeded', 'yes'); }
  });
  const legacyPage = await legacyContext.newPage();
  await legacyPage.goto(base); await legacyPage.getByRole('button', { name: 'Neustart bestätigen', exact: true }).waitFor();
  assert.equal(await legacyPage.evaluate(() => localStorage.getItem('kaffee_state_v2')), null);
  legacyPage.once('dialog', dialog => dialog.dismiss());
  await legacyPage.getByRole('button', { name: 'Neustart bestätigen', exact: true }).click();
  assert.notEqual(await legacyPage.evaluate(() => localStorage.getItem('kaffee_state_v1')), null);
  legacyPage.once('dialog', dialog => dialog.accept());
  await legacyPage.getByRole('button', { name: 'Neustart bestätigen', exact: true }).click();
  await legacyPage.getByRole('heading', { name: 'Kaffee.', exact: true }).waitFor();
  assert.equal(await legacyPage.evaluate(() => localStorage.getItem('kaffee_state_v1')), null);
  await legacyPage.evaluate(() => localStorage.setItem('kaffee_state_v2', '{broken'));
  await legacyPage.reload(); await legacyPage.getByRole('heading', { name: 'Daten konnten nicht geladen werden.', exact: true }).waitFor();
  assert.equal(await legacyPage.evaluate(() => localStorage.getItem('kaffee_state_v2')), '{broken');
    console.log(process.argv.includes('--pwa') ? 'V2_PWA_OK: Offline reload, persisted recipes, offline saving, legacy and corruption recovery.' : 'V2_E2E_OK: All three methods, scaling, steps, timer, beans, snapshots, ratings, filters, backup, offline and recovery.');
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
