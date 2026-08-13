import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";

const APP_ORIGIN = "https://streamflix.dpdns.org";

export function isMobileApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Capacitor.isNativePlatform();
  } catch {
    const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
    return typeof w.Capacitor?.isNativePlatform === "function";
  }
}

function toWebUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === "streamflix:") {
      const host = parsed.hostname ? "/" + parsed.hostname : "";
      return APP_ORIGIN + host + parsed.pathname + parsed.search;
    }
    if (parsed.origin === APP_ORIGIN) return rawUrl;
  } catch {
    // malformed URL
  }
  return null;
}

/**
 * Wires native-shell behavior when running inside the Capacitor WebView:
 * Android hardware back button, status bar styling, and streamflix:// deep
 * links (used for the Google sign-in return path).
 */
export async function initMobileApp(): Promise<void> {
  if (!isMobileApp()) return;
  document.body.classList.add("mobile-app");

  try {
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setBackgroundColor({ color: "#09090b" });
    await StatusBar.setStyle({ style: Style.Dark });
  } catch {
    // plugin unavailable — ignore
  }

  App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      App.exitApp();
    }
  });

  App.addListener("appUrlOpen", ({ url }) => {
    const webUrl = toWebUrl(url);
    if (webUrl) window.location.href = webUrl;
  });

  const launchUrl = await App.getLaunchUrl();
  if (launchUrl?.url) {
    const webUrl = toWebUrl(launchUrl.url);
    if (webUrl && window.location.href !== webUrl) {
      window.location.replace(webUrl);
    }
  }
}
