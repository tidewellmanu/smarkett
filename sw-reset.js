/* One-time cache cleanup so old Firebase/auth JavaScript cannot survive deploys. */
(async () => {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k.startsWith("markethub-")).map(k => caches.delete(k)));
    }
  } catch (e) { console.warn("Cache reset skipped", e); }
})();
