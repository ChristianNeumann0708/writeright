const BASE_PATH = '/BlazorGitTest-Pages';

const PRECACHE_URLS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/css/styles.css`,
  `${BASE_PATH}/js/app.js`,
  `${BASE_PATH}/manifest.webmanifest`
];

// Cache-Name automatisch aus Datum generieren
const CURRENT_CACHE_NAME = 'cache-' + new Date().toISOString().slice(0,10);

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CURRENT_CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map(k => {
        if (k !== CURRENT_CACHE_NAME) return caches.delete(k);
      })
    );
    await self.clients.claim();

    // ⭐ App informieren: Update ist aktiv
    const clients = await self.clients.matchAll();
    clients.forEach(client => client.postMessage({ type: 'UPDATED' }));
  })());
});

// Network-first für alle Dateien
self.addEventListener('fetch', event => {
  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(event.request);
        const cache = await caches.open(CURRENT_CACHE_NAME);
        cache.put(event.request, networkResponse.clone());
        return networkResponse;
      } catch (err) {
        const cached = await caches.match(event.request);
        return cached || new Response('', { status: 504 });
      }
    })()
  );
});
