const APP_ORIGIN = "https://streamflix.dpdns.org";
const APP_SCHEME = "com.itiswayneee.streamflix";

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

export function nativeAppScheme(): string {
  return APP_SCHEME;
}

export function deepLinkToWebUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === "streamflix:" || parsed.protocol === `${APP_SCHEME}:`) {
      const host = parsed.hostname ? "/" + parsed.hostname : "";
      return APP_ORIGIN + host + parsed.pathname + parsed.search + parsed.hash;
    }
    if (parsed.origin === APP_ORIGIN) return rawUrl;
  } catch {
    // malformed URL
  }
  return null;
}

/**
 * Wires native-shell behavior when running inside the Capacitor WebView:
 * Android hardware back button, status bar styling, and deep links (used for
 * the Google sign-in return path).
 */
export async function initMobileApp(): Promise<void> {
  if (!isMobileApp()) return;
  document.body.classList.add("mobile-app");
  const cap = window.Capacitor?.Plugins;

  try {
    await cap?.StatusBar?.setOverlaysWebView({ overlay: false });
    await cap?.StatusBar?.setBackgroundColor({ color: "#09090b" });
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

  try {
    await cap?.App?.addListener("appUrlOpen", ({ url }) => {
      const webUrl = deepLinkToWebUrl(url);
      if (webUrl) window.location.href = webUrl;
    });
  } catch {
    // plugin unavailable — ignore
  }

  try {
    const launchUrl = await cap?.App?.getLaunchUrl();
    if (launchUrl?.url) {
      const webUrl = deepLinkToWebUrl(launchUrl.url);
      if (webUrl && window.location.href !== webUrl) {
        window.location.replace(webUrl);
      }
    }
  } catch {
    // plugin unavailable — ignore
  }
}
