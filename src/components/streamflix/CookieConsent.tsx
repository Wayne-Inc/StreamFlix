import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const STORAGE_KEY = "streamflix:cookieConsent";
const COOKIE_NAME = "streamflix_cookie_consent";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() ?? null;
  return null;
}

function setConsentCookie(value: string) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${COOKIE_NAME}=${value}; path=/; expires=${expires}; SameSite=Lax`;
}

function getStoredStatus() {
  if (typeof window === "undefined") return undefined;
  const stored = localStorage.getItem(STORAGE_KEY) || getCookie(COOKIE_NAME);
  if (stored === "accepted" || stored === "declined") return stored;
  return null;
}

export function CookieConsent() {
  const [status, setStatus] = useState<string | null | undefined>(() => getStoredStatus());

  const accept = () => {
    setStatus("accepted");
    localStorage.setItem(STORAGE_KEY, "accepted");
    setConsentCookie("accepted");
  };

  const decline = () => {
    setStatus("declined");
    localStorage.setItem(STORAGE_KEY, "declined");
    setConsentCookie("declined");
  };

  if (status !== null) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(360px,calc(100%-1rem))] rounded-3xl border border-white/15 bg-white/10 p-3 shadow-[0_18px_40px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150 text-xs text-white ring-1 ring-white/10">
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold tracking-tight text-white">Cookie Consent</p>
          <p className="leading-relaxed text-white/80">
            We use cookies to improve your experience. By accepting, you agree to our <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={decline}
            className="rounded-2xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/15"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="rounded-2xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
