export async function registerSW() {
  if (!("serviceWorker" in navigator)) return;
  // Nuke all old SW registrations first
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((r) => r.unregister()));
  await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
  // Register fresh with a new filename to bypass stale SW
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw-new.js", { updateViaCache: "none" }).catch(() => {});
  });
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

export function isPWAInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches;
}
