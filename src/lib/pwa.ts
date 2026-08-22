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

  // Register Firebase messaging service worker
  const registerFirebaseSW = () => {
    navigator.serviceWorker
      .register("/firebase-messaging-sw.js", { scope: "/" })
      .catch((err) => {
        console.error("Failed to register Firebase messaging service worker:", err);
      });
  };

  if (document.readyState === "complete") {
    registerMainSW();
    registerFirebaseSW();
  } else {
    window.addEventListener("load", () => {
      registerMainSW();
      registerFirebaseSW();
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
