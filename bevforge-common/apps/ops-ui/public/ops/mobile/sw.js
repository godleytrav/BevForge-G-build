const OPS_MOBILE_CACHE = "ops-mobile-shell-v2";
const OPS_MOBILE_ASSETS = [
  "/ops/mobile",
  "/ops/mobile/manifest.webmanifest",
  "/ops-driver-icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(OPS_MOBILE_CACHE)
      .then((cache) => cache.addAll(OPS_MOBILE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== OPS_MOBILE_CACHE)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (!url.pathname.startsWith("/ops/mobile")) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(OPS_MOBILE_CACHE).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) {
            return cached;
          }
          return caches.match("/ops/mobile");
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(OPS_MOBILE_CACHE).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      });
    }),
  );
});
