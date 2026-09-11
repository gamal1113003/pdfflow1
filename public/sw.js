/**
 * orzix service worker.
 *
 * The point of this is that the browser tools keep working with no
 * connection — which is already true of the code, but only if the code itself
 * is on the device.
 *
 * Caching strategy, and the reasoning behind it:
 *
 *   Navigations are network-first. A cache-first page is how a site gets stuck
 *   showing a version from last week, and there is no way for the person to
 *   fix it. Fresh when online, cached when not.
 *
 *   Static assets are cache-first. Next.js puts a content hash in every
 *   filename, so a cached file can never be the wrong version — a new build
 *   asks for new filenames.
 *
 *   Requests to /api are never cached. They convert files; a stale answer
 *   would be a wrong document.
 */

const VERSION = "v1";
const SHELL = `orzix-shell-${VERSION}`;
const ASSETS = `orzix-assets-${VERSION}`;
const PAGES = `orzix-pages-${VERSION}`;

/**
 * Fetched on install so the tools work offline on first use. The PDF.js worker
 * and font data are included deliberately: without the worker, not a single
 * page can be rendered, and the failure is baffling.
 */
const PRECACHE = [
  "/",
  "/tools",
  "/offline",
  "/pdf.worker.min.mjs",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      // One failure should not abandon the whole install.
      await Promise.allSettled(PRECACHE.map((url) => cache.add(url)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL, ASSETS, PAGES]);
      const names = await caches.keys();
      await Promise.all(names.filter((name) => !keep.has(name)).map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/standard_fonts/") ||
    url.pathname === "/pdf.worker.min.mjs" ||
    /\.(?:woff2?|ttf|png|jpg|jpeg|svg|ico|css|js|mjs)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Conversions and auth must always reach the network.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(ASSETS);
          cache.put(request, response.clone());
        }
        return response;
      })(),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            const cache = await caches.open(PAGES);
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offline = await caches.match("/offline");
          return offline ?? new Response("Offline", { status: 503 });
        }
      })(),
    );
  }
});
