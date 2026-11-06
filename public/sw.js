/* global self, caches, URL, fetch */
const OFFLINE_CACHE = "persona-offline-v2";
const PUBLIC_ASSETS = [
  "/offline.html",
  "/icons/persona.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
      .then((cache) => cache.addAll(PUBLIC_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("persona-offline-") && key !== OFFLINE_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname === "/api" ||
    url.pathname.startsWith("/api/")
  )
    return;

  if (PUBLIC_ASSETS.includes(url.pathname) && !url.search) {
    event.respondWith(
      caches
        .open(OFFLINE_CACHE)
        .then((cache) => cache.match(url.pathname))
        .then((cached) => cached || fetch(request)),
    );
    return;
  }
  if (request.mode !== "navigate") return;

  // Never persist responses from the app: conversations and credentials stay out of Cache Storage.
  event.respondWith(
    fetch(request).catch(() => caches.open(OFFLINE_CACHE).then((cache) => cache.match("/offline.html"))),
  );
});
