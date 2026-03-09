const CACHE_NAME = 'mastermind-v1';

self.addEventListener('install', (e) => {
    // Skip waiting to immediately replace older versions
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
    // Basic network-first strategy, falling back to cache
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
