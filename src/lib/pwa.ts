export async function registerSW() {
  if (!("serviceWorker" in navigator)) return;
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
