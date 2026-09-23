// Bei jeder Änderung an SHELL-Assets diesen Namen hochzählen, sonst bleiben Nutzer auf altem Cache.
const CACHE = 'kaffee-shell-v5';

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './src/v2/app.css',
  './src/v2/app.js',
  './src/v2/components.js',
  './src/v2/model.js',
  './src/v2/store.js',
  './src/v2/icons.js',
  './src/styles.css',
  './src/app.css',
  './src/app.js',
  './src/dom.js',
  './src/router.js',
  './src/state.js',
  './src/seedData.js',
  './src/calc.js',
  './src/format.js',
  './src/id.js',
  './src/constants.js',
  './src/components/topbar.js',
  './src/components/choiceList.js',
  './src/components/choiceGroup.js',
  './src/components/confirmDialog.js',
  './src/components/fieldGroup.js',
  './src/screens/home.js',
  './src/screens/variantPicker.js',
  './src/screens/beanPicker.js',
  './src/screens/amount.js',
  './src/screens/result.js',
  './src/screens/tastingEntry.js',
  './src/screens/history.js',
  './src/screens/verwaltung/hub.js',
  './src/screens/verwaltung/beanList.js',
  './src/screens/verwaltung/beanDetail.js',
  './src/screens/verwaltung/beanForm.js',
  './src/screens/verwaltung/variantList.js',
  './src/screens/verwaltung/variantForm.js',
  './src/fonts/archivo-400.woff2',
  './src/fonts/archivo-600.woff2',
  './src/fonts/archivo-800.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon-180.png',
  './icons/apple-touch-icon-167.png',
  './icons/apple-touch-icon-152.png',
  './icons/favicon-32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('kaffee-shell-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((hit) => {
      if (hit) return hit;
      return fetch(event.request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          event.waitUntil(caches.open(CACHE).then((cache) => cache.put(event.request, clone)));
        }
        return res;
      }).catch(() => hit);
    })
  );
});
