import { chromium } from 'playwright';

const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message));

await page.goto('https://manualmanu.github.io/kaffee-app/');
await page.waitForSelector('text=Methode wählen');
await page.waitForTimeout(500);
await page.screenshot({ path: 'D:/Claude/PWA_coffe_app/tools/deploy-home.png' });

await page.click('text=Pour Over V60');
await page.waitForSelector('text=Rezept wählen');

const swState = await page.evaluate(async () => {
  await new Promise(r => setTimeout(r, 1000));
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? { scope: reg.scope, active: reg.active && reg.active.state } : 'NOT_REGISTERED';
});
console.log('SW:', JSON.stringify(swState));
console.log('CONSOLE_ERRORS:', JSON.stringify(errors));

await browser.close();
