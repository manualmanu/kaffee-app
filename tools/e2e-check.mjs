import { chromium } from 'playwright';

const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 402, height: 874 } });
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message));

async function shot(name) {
  await page.waitForTimeout(400); // screenIn-Animation (280ms) abwarten, sonst Screenshot mitten im Fade
  await page.screenshot({ path: `D:/Claude/PWA_coffe_app/tools/shots/${name}.png` });
}

await page.goto('http://localhost:8934/index.html');
await page.waitForSelector('text=Methode wählen');
await shot('01-home');

// Brew flow: V60 -> first variant -> first bean -> amount -> result -> tasting
await page.click('text=Pour Over V60');
await page.waitForSelector('text=Rezept wählen');
await shot('02-variantPicker');

await page.click('.choice-list-item >> nth=0');
await page.waitForSelector('text=Bohne wählen');
await shot('03-beanPicker');

await page.click('.choice-list-item >> nth=0');
await page.waitForSelector('text=Zielmenge');
await shot('04-amount');

await page.click('button:has-text("Rezept berechnen")');
await page.waitForSelector('text=Dein Rezept');
await shot('05-result');

await page.click('button:has-text("Fertig gebraut")');
await page.waitForSelector("text=Wie war's?");
await shot('06-tastingEntry');

await page.click('text=Ausgewogen');
await page.click('text=Gefiel mir');
await page.click('button:has-text("Eintrag speichern")');
await page.waitForSelector('text=Methode wählen');
await shot('07-back-home-after-save');

// Verlauf
await page.click('[aria-label="Verlauf"]');
await page.waitForSelector('text=Verlauf');
await shot('08-history');

// Verwaltung
await page.click('[aria-label="Zurück"]');
await page.waitForSelector('text=Methode wählen');
await page.click('text=Verwaltung');
await page.waitForSelector('text=Verwaltung');
await shot('09-verwaltungHub');

await page.click('text=Bohnen verwalten');
await page.waitForSelector('text=Bohnen');
await shot('10-beanList');

await page.click('.choice-list-item >> nth=0');
await page.waitForSelector('text=Probierte Varianten');
await shot('11-beanDetail');

await page.click('[aria-label="Zurück"]');
await page.waitForSelector('text=Bohnen');
await page.click('text=Neue Bohne anlegen');
await page.waitForSelector('text=Neue Bohne');
await shot('12-beanForm');

await page.fill('input[type="text"] >> nth=0', 'Testbohne E2E');
await page.fill('input[type="text"] >> nth=1', 'Test-Röster');
await page.click('button:has-text("Anlegen")');
await page.waitForSelector('text=Bohnen');
await shot('13-beanList-after-create');

// Varianten-Verwaltung + Pour-Stufen-Editor
await page.click('[aria-label="Zurück"]');
await page.waitForSelector('text=Verwaltung');
await page.click('text=Rezept-Varianten verwalten');
await page.waitForSelector('text=Rezept-Varianten');
await shot('14-variantList');

await page.click('text=Neue Variante (Pour Over V60)');
await page.waitForSelector('text=Neue Variante');
await shot('15-variantForm');

await page.click('button:has-text("+ Stufe hinzufügen")');
await shot('16-variantForm-with-stage');

await browser.close();

console.log('CONSOLE_ERRORS:', JSON.stringify(errors));
console.log(errors.length === 0 ? 'E2E_OK' : 'E2E_HAD_ERRORS');
