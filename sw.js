/**
 * Productive Workspace - Progressive Web App Service Worker
 * Version: 2.2.0
 * Enables offline caching, background sync & instant update notifications
 */

const CACHE_NAME = 'productive-pwa-v2.2.0';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap'
];

// Install Event: Pre-cache static shell assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing new version:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching static assets');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[ServiceWorker] Some assets could not be cached on install:', err);
      });
    })
  );
  // Do not call self.skipWaiting() automatically so user can control update prompt
});

// Listen for message from client to activate immediately
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[ServiceWorker] Received SKIP_WAITING signal, activating now');
    self.skipWaiting();
  }
});

// Activate Event: Clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating version:', CACHE_NAME);
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing obsolete cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-first for navigation & API, Cache-first / Stale-while-revalidate for static assets
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Skip caching for backend API requests (auth, sync, etc.) and non-GET requests
  if (
    event.request.method !== 'GET' ||
    requestUrl.pathname.startsWith('/api/') ||
    requestUrl.origin !== self.location.origin
  ) {
    return;
  }

  // HTML navigation requests: Network-first to ensure latest app version is fetched
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // Static assets (CSS, JS, images, fonts): Cache with Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
