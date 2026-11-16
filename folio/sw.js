const CACHE_NAME = 'folio-app-cache-v1';
const APP_SHELL_URLS = ['./', './index.html'];

let cacheServedCount = 0;

function isCacheableSameOriginRequest(request) {
  if (!request || request.method !== 'GET') return false;
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return false;
  }
  if (url.origin !== self.location.origin) return false;

  // Skip Vite dev HMR / internal transform endpoints and worker source transforms
  const path = url.pathname;
  if (
    path.includes('/@vite') ||
    path.includes('/@react-refresh') ||
    path.includes('/@id/') ||
    path.includes('/@fs/') ||
    path.includes('__vite_ping') ||
    path.endsWith('/sw.js')
  ) {
    return false;
  }
  return true;
}

function isImmutableBuiltAsset(pathname) {
  return (
    pathname.includes('/assets/') &&
    /\.(js|mjs|css|woff2?|png|jpg|jpeg|svg|webp|ico)$/i.test(pathname)
  );
}

async function notifyClientsCacheServed(urlPath, offline) {
  cacheServedCount += 1;
  try {
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    for (const client of clients) {
      client.postMessage({
        type: 'FOLIO_SW_STATUS',
        active: true,
        cacheName: CACHE_NAME,
        cachedAssetCount: keys.length,
        servedFromCache: true,
        cacheServedCount,
        lastServedUrl: urlPath,
        offline: Boolean(offline),
      });
    }
  } catch {
    // Ignore client messaging errors
  }
}

async function sendCurrentStatus(target) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    target.postMessage({
      type: 'FOLIO_SW_STATUS',
      active: true,
      cacheName: CACHE_NAME,
      cachedAssetCount: keys.length,
      servedFromCache: cacheServedCount > 0,
      cacheServedCount,
      lastServedUrl: null,
      offline: false,
    });
  } catch {
    // Ignore cache inspection errors
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith('folio-app-cache-') && name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
      .then(async () => {
        const clients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        });
        await Promise.all(clients.map((client) => sendCurrentStatus(client)));
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FOLIO_PING_SW_STATUS') {
    const source = event.source;
    if (source && typeof source.postMessage === 'function') {
      event.waitUntil(sendCurrentStatus(source));
    }
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (!isCacheableSameOriginRequest(request)) return;

  const url = new URL(request.url);
  const isNavigation =
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html');

  // Content-hashed production assets: serve from local cache when available,
  // and fall back to network + populate cache on first fetch.
  if (isImmutableBuiltAsset(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) {
          void notifyClientsCacheServed(url.pathname, false);
          return cached;
        }
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
          cache.put(request, networkResponse.clone()).catch(() => {});
        }
        return networkResponse;
      })
    );
    return;
  }

  // Navigation & dynamic modules: Network-first with automatic local cache fallback
  // when offline or when network is unreachable.
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok && !url.searchParams.has('t')) {
          cache.put(request, networkResponse.clone()).catch(() => {});
        }
        return networkResponse;
      } catch {
        const cached =
          (await cache.match(request)) ||
          (isNavigation ? (await cache.match('./index.html')) || (await cache.match('./')) : null);
        if (cached) {
          void notifyClientsCacheServed(url.pathname, true);
          return cached;
        }
        throw new Error('Offline and resource not cached');
      }
    })
  );
});
