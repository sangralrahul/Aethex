/**
 * After a deploy, a browser can still hold the previous version of the site
 * (the service worker's copy) and ask for files that no longer exist. This
 * forgets the cached copy of the app and loads the current one from the
 * network. The service worker registers again on that load (src/main.tsx).
 */
export async function reloadFresh(): Promise<void> {
  try {
    const regs = await navigator.serviceWorker?.getRegistrations?.();
    if (regs) await Promise.all(regs.map((r) => r.unregister()));
  } catch { /* not supported or blocked */ }
  try {
    if (typeof caches !== "undefined") {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("workbox-precache") || k === "aethex-chunks" || k === "aethex-pages").map((k) => caches.delete(k)));
    }
  } catch { /* blocked */ }
  window.location.reload();
}
