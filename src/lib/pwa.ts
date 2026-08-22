export async function registerSW() {
  if (!("serviceWorker" in navigator)) return;

  // Register your main service worker (for caching/offline)
  const registerMainSW = () => {
    navigator.serviceWorker
      .register("/sw-new.js", { updateViaCache: "none" })
      .catch((err) => {
        console.error("Failed to register main service worker:", err);
      });
  };

  if (document.readyState === "complete") {
    registerMainSW();
  } else {
    window.addEventListener("load", () => {
      registerMainSW();
    }, { once: true });
  }

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