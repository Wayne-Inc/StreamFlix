let deferredPrompt: BeforeInstallPromptEvent | null = null;

const INSTALLED_KEY = "sf:pwa-installed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

if (typeof window !== "undefined") {
  // Capture the install prompt as early as the module loads so UI buttons
  // can open it at any time.
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    // Remember the install so download buttons stay hidden in later sessions,
    // even when browsing in a normal tab where no prompt event fires.
    try {
      localStorage.setItem(INSTALLED_KEY, "1");
    } catch {
      /* ignore */
    }
  });
}

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

export function hasInstalledPWA() {
  if (typeof window === "undefined") return false;
  if (isPWAInstalled()) return true;
  try {
    return localStorage.getItem(INSTALLED_KEY) === "1";
  } catch {
    return false;
  }
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
    if (choice.outcome === "accepted") {
      try {
        localStorage.setItem(INSTALLED_KEY, "1");
      } catch {
        /* ignore */
      }
      return "installed";
    }
    return "dismissed";
  } catch {
    deferredPrompt = null;
    return "unavailable";
  }
}
