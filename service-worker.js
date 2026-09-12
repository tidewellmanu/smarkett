const CACHE = "markethub-v5";
const CORE = ["/", "/index.html", "/css/style.css", "/css/components.css", "/css/responsive.css"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("markethub-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  // Never cache JavaScript modules, Firebase requests, authentication pages,
  // or other dynamic data. This prevents stale auth/Firestore code in production.
  if (url.origin !== location.origin || url.pathname.endsWith(".js") || url.pathname.includes("/__/")) return;
  event.respondWith(
    fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {});
      return response;
    }).catch(() => caches.match(event.request).then(r => r || caches.match("/index.html")))
  );
});
