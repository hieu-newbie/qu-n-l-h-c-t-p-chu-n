/* ============================================================================
   STUDYHUB PWA SERVICE WORKER (Offline App Shell + Relative Subpath Safe)
   Works cleanly on root domains (Vercel/Netlify) AND GitHub Pages subpaths!
   ============================================================================ */
const CACHE_NAME = "studyhub-pwa-v2";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./css/styles.css",
  "./js/storage.js",
  "./js/charts.js",
  "./js/ai.js",
  "./js/pwa.js",
  "./js/views.js",
  "./js/app.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.all(
          CORE_ASSETS.map((asset) =>
            cache.add(new Request(asset, { cache: "reload" })).catch(() => null)
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("studyhub-pwa-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Never intercept or cache external AI API requests
  if (
    url.hostname.includes("googleapis.com") && url.pathname.includes("interactions") ||
    url.hostname.includes("openai.com") ||
    url.hostname.includes("openrouter.ai")
  ) {
    return;
  }

  // Same-origin app shell & assets: Network-first with live Cache update + Offline fallback
  if (url.origin === self.location.origin) {
    if (req.mode === "navigate") {
      event.respondWith(
        fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put("./index.html", copy));
            }
            return res;
          })
          .catch(() => caches.match("./index.html").then((r) => r || caches.match("./")))
      );
      return;
    }

    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Google Fonts: Cache-first so typography looks crisp offline too
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() => cached);
      })
    );
  }
});
