import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:8934/index.html');
await page.waitForTimeout(500);

const manifestHref = await page.$eval('link[rel="manifest"]', el => el.href);
const manifestRes = await page.evaluate(async (url) => {
  const res = await fetch(url);
  return { status: res.status, body: await res.json() };
}, manifestHref);
console.log('MANIFEST:', JSON.stringify(manifestRes, null, 2));

const swState = await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return 'NOT_SUPPORTED';
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? { scope: reg.scope, active: !!reg.active } : 'NOT_REGISTERED_YET';
});
console.log('SW_INITIAL:', JSON.stringify(swState));

// Warten bis der SW tatsächlich aktiv ist (Registrierung passiert async im 'load'-Handler)
await page.waitForFunction(async () => {
  if (!('serviceWorker' in navigator)) return true;
  const reg = await navigator.serviceWorker.getRegistration();
  return reg && reg.active;
}, { timeout: 10000 }).catch(() => console.log('SW did not activate in time'));

const swFinal = await page.evaluate(async () => {
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? { scope: reg.scope, activeState: reg.active && reg.active.state } : null;
});
console.log('SW_FINAL:', JSON.stringify(swFinal));

// Cache-Inhalt prüfen
const cacheInfo = await page.evaluate(async () => {
  const names = await caches.keys();
  const out = {};
  for (const n of names) {
    const cache = await caches.open(n);
    const keys = await cache.keys();
    out[n] = keys.length;
  }
  return out;
});
console.log('CACHES:', JSON.stringify(cacheInfo));

// Jetzt offline testen: Netzwerk kappen und neu laden
await page.context().setOffline(true);
await page.reload();
const offlineOk = await page.waitForSelector('text=Methode wählen', { timeout: 5000 }).then(() => true).catch(() => false);
console.log('WORKS_OFFLINE:', offlineOk);

await browser.close();
