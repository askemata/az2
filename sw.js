// sw.js — Askesis-Zettel Service Worker
// Hospede este arquivo no mesmo diretório que askesis-zettel.html

const CACHE = "askesis-zettel-v5";

self.addEventListener("install", e => {
  self.skipWaiting();
  // Pre-cache the app shell
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.add("./askesis-zettel.html").catch(() => {})
    )
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    // Cache-first for same-origin (the app HTML itself)
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          const fetchPromise = fetch(e.request).then(r => {
            cache.put(e.request, r.clone());
            return r;
          });
          return cached || fetchPromise;
        })
      )
    );
  } else {
    // Network-first with cache fallback for external resources (fonts, etc.)
    e.respondWith(
      fetch(e.request)
        .then(r => {
          caches.open(CACHE).then(c => c.put(e.request, r.clone()));
          return r;
        })
        .catch(() => caches.match(e.request))
    );
  }
});