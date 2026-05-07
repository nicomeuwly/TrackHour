const CACHE_NAV = 'trackhour-nav-v1';
const CACHE_ASSETS = 'trackhour-assets-v1';
const CACHE_STATIC = 'trackhour-static-v1';
const ALL_CACHES = [CACHE_NAV, CACHE_ASSETS, CACHE_STATIC];
const OFFLINE_URL = '/offline.html';

importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

// Skip waiting when asked by the app
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// Pre-cache the offline fallback on install
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAV).then((cache) => cache.add(OFFLINE_URL))
    );
    self.skipWaiting();
});

// Clean up old cache versions on activate
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((k) => !ALL_CACHES.includes(k))
                    .map((k) => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

if (workbox.navigationPreload.isSupported()) {
    workbox.navigationPreload.enable();
}

// Navigation pages: network-first, fall back to cache, then offline page
workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
        cacheName: CACHE_NAV,
        plugins: [
            new workbox.expiration.ExpirationPlugin({ maxEntries: 30 }),
        ],
    })
);

// Images & fonts: cache-first (long-lived)
workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image' || request.destination === 'font',
    new workbox.strategies.CacheFirst({
        cacheName: CACHE_ASSETS,
        plugins: [
            new workbox.expiration.ExpirationPlugin({
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            }),
        ],
    })
);

// JS & CSS: stale-while-revalidate
workbox.routing.registerRoute(
    ({ request }) => request.destination === 'script' || request.destination === 'style',
    new workbox.strategies.StaleWhileRevalidate({ cacheName: CACHE_STATIC })
);

// Offline fallback for any navigation that fails
workbox.routing.setCatchHandler(async ({ request }) => {
    if (request.destination === 'document') {
        return caches.match(OFFLINE_URL);
    }
    return Response.error();
});
