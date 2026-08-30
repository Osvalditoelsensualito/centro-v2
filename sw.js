/* Centro — Service Worker
   Kept intentionally small: offline/cache support only. No credentials, no API proxying. */
const CACHE_NAME = 'centro-pwa-shell-v20';
const MANIFEST_OVERRIDE_CACHE = 'centro-pwa-manifest-overrides-v1';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    // The app creates a same-origin manifest snapshot in this dedicated cache.
    if (url.pathname.endsWith('/manifest.json')) {
      const overrideCache = await caches.open(MANIFEST_OVERRIDE_CACHE);
      const override = await overrideCache.match(request);
      if (override) return override;
    }

    try {
      const response = await fetch(request);
      if (response && response.ok && response.type !== 'opaque') {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      throw error;
    }
  })());
});
