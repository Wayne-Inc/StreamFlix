const APP_ORIGIN = "https://streamflix.dpdns.org";

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      Plugins?: {
        App?: {
          addListener: (
            event: string,
            callback: (data: { url: string; canGoBack?: boolean }) => void,
          ) => Promise<{ remove: () => void }>;
          getLaunchUrl: () => Promise<{ url: string }>;
          exitApp?: () => void;
        };
        StatusBar?: {
          setOverlaysWebView: (options: { overlay: boolean }) => Promise<void>;
          setBackgroundColor: (options: { color: string }) => Promise<void>;
          setStyle: (options: { style: number }) => Promise<void>;
        };
      };
    };
    NativeBridge?: {
      enterPipMode: () => void;
      isPipSupported: () => boolean;
      startMediaServiceNative: () => void;
      stopMediaServiceNative: () => void;
    };
  }
}

export function isMobileApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return typeof window.Capacitor?.isNativePlatform === "function"
      ? window.Capacitor.isNativePlatform()
      : false;
  } catch {
    return false;
  }
}

export function isPipSupported(): boolean {
  if (typeof window === "undefined") return false;
  try {
    // Native bridge
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
 * Wires native-shell behavior when running inside the Capacitor WebView:
 * Android hardware back button and status bar styling.
 */
export async function initMobileApp(): Promise<void> {
  if (!isMobileApp()) return;
  document.body.classList.add("mobile-app");
  const cap = window.Capacitor?.Plugins;

try {
      await cap?.StatusBar?.setOverlaysWebView({ overlay: false });
      await cap?.StatusBar?.setBackgroundColor({ color: "#000000" });
      await cap?.StatusBar?.setStyle({ style: 1 }); // Style.Dark
    } catch {
    // plugin unavailable — ignore
  }

  try {
    await cap?.App?.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        cap.App?.exitApp?.();
      }
    });
  } catch {
    // plugin unavailable — ignore
  }

  if (typeof window !== "undefined") {
    window.addEventListener("pip-mode-changed", ((e: CustomEvent) => {
      document.body.classList.toggle("pip-active", e.detail === true);
    }) as EventListener);
  }
}
