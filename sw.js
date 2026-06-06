const CACHE = 'hdcredit-v2';
const SHELL = [
  '/HDcredit1.2/manifest.json',
  '/HDcredit1.2/icon-192.png',
  '/HDcredit1.2/icon-512.png'
];

// Instalar — solo cachea assets estáticos (íconos, manifest), NO el HTML
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

// Activar — limpia caches viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch — Network First para HTML/JS, Cache First para íconos/manifest
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isHTML = e.request.destination === 'document' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  const isScript = e.request.destination === 'script';

  if (isHTML || isScript) {
    // Network first: siempre intenta red, fallback a cache solo si offline
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache first para estáticos (íconos, fuentes, CSS externo)
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
});
