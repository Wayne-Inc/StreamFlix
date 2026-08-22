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
  let lastUpdateCheck = 0;
  const UPDATE_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // Prevent refresh loops
    if (refreshing) return;

    // Check if enough time has passed since last update check
    const now = Date.now();
    if (now - lastUpdateCheck < UPDATE_CHECK_INTERVAL) {
      // Too soon since last check - defer refresh
      return;
    }
    lastUpdateCheck = now;

    // Don't refresh if user is actively engaged
    if (document.visibilityState === 'visible' && !document.hidden) {
      // User has a visible tab - check for recent interaction
      const lastInteraction = parseInt(localStorage.getItem('sw-last-interaction') || '0', 10);
      const timeSinceInteraction = now - lastInteraction;

      // If user interacted within last 2 minutes, defer refresh
      if (timeSinceInteraction < 2 * 60 * 1000) {
        // Schedule a refresh for when they become inactive
        const checkInactivity = () => {
          if (document.visibilityState !== 'visible' || document.hidden) {
            refreshing = true;
            window.location.reload();
          } else {
            // Check again in 30 seconds
            setTimeout(checkInactivity, 30 * 1000);
          }
        };

        setTimeout(checkInactivity, 30 * 1000);
        return;
      }
    }

    // Safe to refresh - user is inactive or it's been a while
    refreshing = true;
    window.location.reload();
  });

  // Track user interactions
  const updateInteractionTimestamp = () => {
    localStorage.setItem('sw-last-interaction', Date.now().toString());
  };

  ['click', 'keypress', 'scroll', 'touchstart', 'mousedown'].forEach(eventType => {
    window.addEventListener(eventType, updateInteractionTimestamp, { passive: true });
  });

  // Initialize interaction timestamp if not set
  if (!localStorage.getItem('sw-last-interaction')) {
    localStorage.setItem('sw-last-interaction', Date.now().toString());
  }
}

export function isPWAInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches;
}