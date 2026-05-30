const CACHE_VERSION = 'diekus-v5';

const SHELL = [
  '/',
  '/index.html',
  '/projects.html',
  '/gallery.html',
  '/offline.html',
  '/css/styles.css',
  '/css/gallery.css',
  '/js/canvas.js',
  '/js/theme.js',
  '/js/projects.js',
  '/js/projects-home.js',
  '/js/projects-page.js',
  '/js/gallery.js',
  '/js/gallery-teaser.js',
  '/js/social.js',
  '/css/social.css',
  '/projects.json',
  '/gallery.json',
  '/manifest.webmanifest',
  '/icons/favicon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/images/diekus.jpg',
  '/images/hero/manifest.json',
];

// ── Install — cache the shell ──────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

// ── Activate — remove old caches and claim all clients ────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_VERSION)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    // Navigation: network-first; fall back to cache then offline page
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(request)
          .then(cached => cached ?? caches.match('/offline.html'))
        )
    );
    return;
  }

  // Shell assets: cache-first
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        // Cache successful same-origin GET responses
        if (response.ok && request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
