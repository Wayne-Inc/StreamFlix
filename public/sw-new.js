const CACHE_NAME = "streamflix-cache-v2";
const ASSET_CACHE = "streamflix-assets-v2";

const PRECACHE_URLS = ["/", "/offline", "/browse"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys.filter((k) => k !== CACHE_NAME && k !== ASSET_CACHE).map((k) => caches.delete(k)),
          ),
        ),
      self.clients.claim(),
    ]),
  );
});

const IMG_EXT = /\.(png|jpg|jpeg|gif|webp|avif|svg|ico)$/i;

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.hostname === "image.tmdb.org") {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.destination === "image" || IMG_EXT.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font"
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.pathname.startsWith("/api/") || url.pathname.includes("tmdb")) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(ASSET_CACHE);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    return caches.match("/offline");
  }
}

async function networkFirst(request) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(request);
    return cached || caches.match("/offline");
  }
}
