const CACHE = 'hdcredit-v1';
const ASSETS = [
  '/HDcredit1.2/',
  '/HDcredit1.2/index.html',
  '/HDcredit1.2/manifest.json',
  '/HDcredit1.2/icon-192.png',
  '/HDcredit1.2/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
