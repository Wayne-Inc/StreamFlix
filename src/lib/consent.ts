const STORAGE_KEY = "streamflix:cookieConsent";
const COOKIE_NAME = "streamflix_cookie_consent";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() ?? null;
  return null;
}

export function hasConsent(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(STORAGE_KEY) || getCookie(COOKIE_NAME);
  return stored === "accepted";
}

export function isConsentDecided(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(STORAGE_KEY) || getCookie(COOKIE_NAME);
  return stored === "accepted" || stored === "declined";
}

type ConsentModeSettings = {
  ad_user_data: "granted" | "denied";
  ad_personalization: "granted" | "denied";
  ad_storage: "granted" | "denied";
  analytics_storage: "granted" | "denied";
};

function consentModeSettings(granted: boolean): ConsentModeSettings {
  const state = granted ? "granted" : "denied";
  return {
    ad_user_data: state,
    ad_personalization: state,
    ad_storage: state,
    analytics_storage: state,
  };
}

function gtagPush(...args: unknown[]) {
  if (typeof window === "undefined") return;
  const w = window as Window & { gtag?: (...a: unknown[]) => void; dataLayer?: unknown[] };
  if (typeof w.gtag === "function") {
    w.gtag(...args);
    return;
  }
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push(args);
}

export function updateConsentMode(granted: boolean) {
  gtagPush("consent", "update", consentModeSettings(granted));
}
