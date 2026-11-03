const APP_ORIGIN = "https://streamflix.dpdns.org";

declare global {
  interface Window {
    NativeBridge?: {
      enterPipMode: () => void;
      isPipSupported: () => boolean;
      startMediaServiceNative: () => void;
      stopMediaServiceNative: () => void;
    };
  }
}

export function isMobileApp(): boolean {
  // We're a pure web/PWA app now - no native wrappers
  return false;
}

export function isPipSupported(): boolean {
  if (typeof window === "undefined") return false;
  try {
    // Native bridge (for future native app support)
    if (window.NativeBridge?.isPipSupported()) return true;
  } catch {}
  try {
    return (document as any).pictureInPictureEnabled === true;
  } catch {
    return false;
  }
}

export function enterPipModeNative(): void {
  try {
    window.NativeBridge?.enterPipMode();
  } catch {}
}

export async function enterPictureInPicture(videoElement: HTMLVideoElement): Promise<boolean> {
  // On native app, use the native PiP bridge instead
  if (isMobileApp() && window.NativeBridge?.isPipSupported()) {
    enterPipModeNative();
    return true;
  }
  try {
    if (isPipSupported() && document.pictureInPictureElement !== videoElement) {
      await videoElement.requestPictureInPicture();
      return true;
    }
  } catch {}
  return false;
}

/**
 * Wires native-shell behavior when running inside a native WebView.
 * Currently no-op since we're a pure web/PWA app.
 */
export async function initMobileApp(): Promise<void> {
  if (!isMobileApp()) return;

  if (typeof window !== "undefined") {
    window.addEventListener("pip-mode-changed", ((e: CustomEvent) => {
      document.body.classList.toggle("pip-active", e.detail === true);
    }) as EventListener);
  }
}
