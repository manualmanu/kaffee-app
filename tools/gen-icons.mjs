import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:8934/tools/make-icons.html');
await page.click('#go');
await page.waitForFunction(() => document.querySelectorAll('#out a').length === 7);

const links = await page.$$('#out a');
for (const link of links) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    link.click(),
  ]);
  const name = download.suggestedFilename();
  await download.saveAs(`D:/Claude/PWA_coffe_app/icons/${name}`);
  console.log('wrote', name);
}

await browser.close();
console.log('ICONS_DONE');
