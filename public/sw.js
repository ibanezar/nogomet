// Minimal service worker: exists only so the browser considers this page
// installable. It deliberately does not cache anything — the schedule and
// live location must always come straight from the network.
self.addEventListener("install", () => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", () => {
  // no-op: let the browser handle every request normally
});
