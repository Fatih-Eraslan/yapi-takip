const CACHE = "yapitakip-v1";
const OFFLINE_URL = "/offline";

const PRECACHE = [
  "/",
  "/dashboard",
  "/offline",
  "/manifest.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  // API istekleri: her zaman ağdan al, hata olursa geç
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(
      fetch(e.request).catch(() => new Response(JSON.stringify({ error: "Çevrimdışısınız" }), {
        headers: { "Content-Type": "application/json" },
      }))
    );
    return;
  }

  // Sayfa istekleri: network-first, fallback offline
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
        return res;
      })
      .catch(() =>
        caches.match(e.request).then((cached) => cached ?? caches.match(OFFLINE_URL))
      )
  );
});
