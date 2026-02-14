// service-worker.js

// Basis-Pfad für GitHub Pages (Repo: writeright)
const BASE_PATH = '/writeright';

// Optionale Versionsnummer für bessere Nachvollziehbarkeit
// Optionale Versionsnummer für bessere Nachvollziehbarkeit
const VERSION = 'v2.0.0';

// Cache-Name: Version + Datum
const CURRENT_CACHE_NAME = `cache-${VERSION}-${new Date().toISOString().slice(0, 10)}`;

// Dateien, die beim Installieren vorgeladen werden sollen
const PRECACHE_URLS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/worttrainer.html`,
  `${BASE_PATH}/vokabeltrainer.html`,
  `${BASE_PATH}/settings.html`,
  `${BASE_PATH}/import.html`,
  `${BASE_PATH}/info.html`,
  
  `${BASE_PATH}/css/base.css`,
  `${BASE_PATH}/css/layout.css`,
  `${BASE_PATH}/css/menu.css`,
  `${BASE_PATH}/css/start.css`,
  `${BASE_PATH}/css/worttrainer.css`,
  `${BASE_PATH}/css/vokabeltrainer.css`,
  `${BASE_PATH}/css/settings.css`,

  `${BASE_PATH}/js/core/StorageService.js`,
  `${BASE_PATH}/js/models/Wort.js`,
  `${BASE_PATH}/js/models/Vokabel.js`,

  `${BASE_PATH}/js/common/settings.js`,
  `${BASE_PATH}/js/common/import.js`,
  `${BASE_PATH}/js/common/indexedBackup.js`,
  `${BASE_PATH}/js/common/menu.js`,

  `${BASE_PATH}/js/worttrainer/timer.js`,
  `${BASE_PATH}/js/worttrainer/worttrainer.js`,
  `${BASE_PATH}/js/worttrainer/worttrainer-storage.js`,
  `${BASE_PATH}/js/worttrainer/worttrainer-logic.js`,
  `${BASE_PATH}/js/worttrainer/worttrainer-ui.js`,

  `${BASE_PATH}/js/vokabeltrainer/vokabeltrainer.js`,
  `${BASE_PATH}/js/vokabeltrainer/vokabeltrainer-storage.js`,
  `${BASE_PATH}/js/vokabeltrainer/vokabeltrainer-logic.js`,
  `${BASE_PATH}/js/vokabeltrainer/vokabeltrainer-ui.js`,

  `${BASE_PATH}/manifest.webmanifest`,
  `${BASE_PATH}/icons/icon-192.png`,
  `${BASE_PATH}/icons/icon-512.png`
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
