const STATIC_CACHE_NAME = "portfolio-static-v1";
const DYNAMIC_CACHE_NAME = "portfolio-dynamic-v1";

// Assets to cache immediately on install
const STATIC_ASSETS = [
  "/",
  "/about/",
  "/projects/",
  "/resume/",
  "/tutorials/",
  "/favicon.svg",
  "/fonts/DepartureMono/DepartureMonoNerdFontMono-Regular.woff2",
  "/grunge.webp",
  "/manifest.json",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      // Caching static assets
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME;
          })
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache when possible
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip external requests
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  // Network-first strategy for API calls
  if (url.pathname.includes("/api/")) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          const cache = await caches.open(DYNAMIC_CACHE_NAME);
          cache.put(request, response.clone());
          return response;
        } catch {
          return caches.match(request);
        }
      })()
    );
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Update cache in background for next visit
        fetch(request).then((response) => {
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(request, response);
          });
        });
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }

          // Clone the response before caching
          const responseToCache = response.clone();

          caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Offline fallback for HTML pages
          if (request.headers.get("accept").includes("text/html")) {
            return caches.match("/");
          }
        });
    })
  );
});
