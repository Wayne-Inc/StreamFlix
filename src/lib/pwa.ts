export async function registerSW() {
  if (!("serviceWorker" in navigator)) return;

  const doRegister = () => {
    navigator.serviceWorker
      .register("/sw-new.js", { updateViaCache: "none" })
      .catch(() => {});
  };

  if (document.readyState === "complete") {
    doRegister();
  } else {
    window.addEventListener("load", doRegister, { once: true });
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
