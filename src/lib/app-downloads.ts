export const APP_DOWNLOADS = {
  windows: {
    label: "Windows",
    description: "Desktop app for Windows 10 and 11",
    file: "StreamFlix-Desktop.exe",
    size: "96 MB",
    url: "/downloads/StreamFlix-Desktop.exe",
  },
  android: {
    label: "Android",
    description: "Mobile app for Android phones and tablets",
    file: "StreamFlix-Mobile.apk",
    size: "6.7 MB",
    url: "/downloads/StreamFlix-Mobile.apk",
  },
} as const;

export type InstallPlatform = "windows" | "android" | "other";

function isInElectron(): boolean {
  return typeof window !== "undefined" && "electronAPI" in window;
}

function isInCapacitor(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  return typeof w.Capacitor?.isNativePlatform === "function" && w.Capacitor.isNativePlatform();
}

export function isInApp(): boolean {
  return isInElectron() || isInCapacitor();
}

export function detectInstallPlatform(ua: string = navigator.userAgent): InstallPlatform {
  if (isInApp()) return "other";
  const u = ua;
  if (/android/i.test(u)) return "android";
  if (/windows/i.test(u) || /win32|win64/i.test(navigator.platform || "")) return "windows";
  return "other";
}
