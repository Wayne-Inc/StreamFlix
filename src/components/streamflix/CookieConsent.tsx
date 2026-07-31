import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { hasConsent, isConsentDecided } from "@/lib/consent";

const STORAGE_KEY = "streamflix:cookieConsent";
const COOKIE_NAME = "streamflix_cookie_consent";

function setConsent(value: string) {
  if (typeof document === "undefined") return;
  localStorage.setItem(STORAGE_KEY, value);
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${COOKIE_NAME}=${value}; path=/; expires=${expires}; SameSite=Lax`;
}

export function CookieConsent() {
  const [decided, setDecided] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isConsentDecided()) setDecided(true);
  }, []);

  if (!mounted) return null;
  if (decided) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto w-[min(360px,calc(100%-2rem))] rounded-3xl border border-white/15 bg-white/10 p-3 shadow-[0_18px_40px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150 text-xs text-white ring-1 ring-white/10 md:inset-x-auto md:right-4 md:mx-0">
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold tracking-tight text-white">Cookie Consent</p>
          <p className="leading-relaxed text-white/80">
            We use cookies and tracking to personalize content and analyze traffic. By accepting,
            you agree to our{" "}
            <Link to="/privacy-policy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={() => {
              setConsent("declined");
              setDecided(true);
            }}
            className="rounded-2xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/15"
          >
            Decline
          </button>
          <button
            onClick={() => {
              setConsent("accepted");
              setDecided(true);
            }}
            className="rounded-2xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
