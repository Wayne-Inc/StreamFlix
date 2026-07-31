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
