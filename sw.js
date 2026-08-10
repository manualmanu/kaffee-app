const CACHE = 'kaffee-shell-v1';

const SHELL = [
  './',
  './index.html',
  './manifest.json',
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
  './icons/apple-touch-icon-180.png',
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
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((hit) => {
      if (hit) return hit;
      return fetch(event.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        return res;
      }).catch(() => hit);
    })
  );
});
