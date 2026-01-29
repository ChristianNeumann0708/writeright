// service-worker.js

// Basis-Pfad für GitHub Pages (Repo: writeright)
const BASE_PATH = '/writeright';

// Optionale Versionsnummer für bessere Nachvollziehbarkeit
const VERSION = 'v1.0.0';

// Cache-Name: Version + Datum
const CURRENT_CACHE_NAME = `cache-${VERSION}-${new Date().toISOString().slice(0, 10)}`;

// Dateien, die beim Installieren vorgeladen werden sollen
const PRECACHE_URLS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/css/styles.css`,
  `${BASE_PATH}/js/app.js`,
  `${BASE_PATH}/js/indexedBackup.js`,
  `${BASE_PATH}/js/timer.js`,
  `${BASE_PATH}/js/menu.js`,
  `${BASE_PATH}/manifest.webmanifest`,
  `${BASE_PATH}/icons/icon-192.png`,
  `${BASE_PATH}/icons/icon-512.png`,
  // Optional: Favicon, falls vorhanden
  //`${BASE_PATH}/favicon.ico`
];

// INSTALL: neuen Cache anlegen und Dateien precachen
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CURRENT_CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
});

// ACTIVATE: alte Caches löschen, neuen aktivieren, Clients informieren
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map(k => {
        if (k !== CURRENT_CACHE_NAME) {
          return caches.delete(k);
        }
      })
    );

    await self.clients.claim();

    // App informieren: Update ist aktiv
    const clients = await self.clients.matchAll();
    clients.forEach(client => client.postMessage({ type: 'UPDATED' }));
  })());
});

// FETCH: Network-first für GET-Anfragen
self.addEventListener('fetch', event => {
  // Nur GET-Anfragen abfangen (keine POST/PUT/etc.)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    (async () => {
      try {
        // Versuch: aus dem Netz laden
        const networkResponse = await fetch(event.request);

        // Erfolgreiche Antwort im aktuellen Cache speichern
        const cache = await caches.open(CURRENT_CACHE_NAME);
        cache.put(event.request, networkResponse.clone());

        return networkResponse;
      } catch (err) {
        // Fallback: aus dem Cache laden
        const cached = await caches.match(event.request);
        return cached || new Response('', { status: 504 });
      }
    })()
  );
});
