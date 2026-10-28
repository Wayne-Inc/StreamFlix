let deferredPrompt: BeforeInstallPromptEvent | null = null;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

if (typeof window !== "undefined") {
  // Capture the install prompt as early as the module loads so UI buttons
  // can open it at any time.
  // Note: We do NOT call preventDefault() here to allow the browser's
  // native install prompt to appear automatically. The deferred prompt
  // is still captured for manual triggering via promptInstall() if needed.
  window.addEventListener("beforeinstallprompt", (e) => {
    deferredPrompt = e as BeforeInstallPromptEvent;
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
  });
}

export async function registerSW() {
  if (!("serviceWorker" in navigator)) return;

  // Register your main service worker (for caching/offline)
  const registerMainSW = () => {
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .catch((err) => {
        console.error("Failed to register main service worker:", err);
      });
  };

  if (document.readyState === "complete") {
    registerMainSW();
  } else {
    window.addEventListener(
      "load",
      () => {
        registerMainSW();
      },
      { once: true },
    );
  }

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

export function isPWAInstalled() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

export function canPromptInstall() {
  return deferredPrompt !== null;
}

export async function promptInstall(): Promise<"installed" | "dismissed" | "unavailable"> {
  if (!deferredPrompt) return "unavailable";
  try {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return choice.outcome === "accepted" ? "installed" : "dismissed";
  } catch {
    deferredPrompt = null;
    return "unavailable";
  }
}
