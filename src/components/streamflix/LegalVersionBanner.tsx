"use client";

import { Link, useNavigate } from "@tanstack/react-router";
import { X, AlertCircle, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { TOS_VERSION } from "@/routes/tos";
import { PRIVACY_VERSION } from "@/routes/privacy-policy";
import { getUserLegalVersions, checkVersionsOutdated } from "@/lib/user-versions";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

type BannerProps = {
  onDismiss?: () => void;
};

/**
 * Banner shown when user's accepted TOS/Privacy Policy versions are outdated.
 * Checks Firestore for stored versions and compares with current versions.
 */
export function LegalVersionBanner({ onDismiss }: BannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [tosOutdated, setTosOutdated] = useState(false);
  const [privacyOutdated, setPrivacyOutdated] = useState(false);
  const [checked, setChecked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let active = true;

    const checkVersions = async (user: { uid: string } | null) => {
      if (!user) {
        if (active) {
          setChecked(true);
          setShowBanner(false);
        }
        return;
      }

      try {
        const stored = await getUserLegalVersions(user.uid);
        const result = checkVersionsOutdated(stored, TOS_VERSION, PRIVACY_VERSION);
        if (active) {
          setTosOutdated(result.tosOutdated);
          setPrivacyOutdated(result.privacyOutdated);
          setShowBanner(result.tosOutdated || result.privacyOutdated);
          setChecked(true);
        }
      } catch {
        if (active) {
          setChecked(true);
          setShowBanner(false);
        }
      }
    };

    // Wait for auth to be ready
    unsubscribe = onAuthStateChanged(auth, (user) => {
      checkVersions(user);
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  if (!checked || !showBanner) return null;

  const handleDismiss = () => {
    setShowBanner(false);
    onDismiss?.();
  };

  const outdatedItems = [
    tosOutdated && { label: "Terms of Service", path: "/tos", version: TOS_VERSION },
    privacyOutdated && { label: "Privacy Policy", path: "/privacy-policy", version: PRIVACY_VERSION },
  ].filter(Boolean) as { label: string; path: string; version: string }[];

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 animate-slide-down"
      role="alert"
      aria-live="polite"
    >
      <div className="mx-auto max-w-4xl flex items-start gap-3">
        <AlertCircle className="size-5 shrink-0 text-amber-400 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-400">
            Legal documents updated
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            We've updated our{" "}
            {outdatedItems.map((item, i) => (
              <span key={item.label}>
                <Link
                  to={item.path}
                  className="underline hover:text-amber-300 transition-colors font-medium"
                  onClick={() => navigate({ to: item.path })}
                >
                  {item.label}
                </Link>
                {i === outdatedItems.length - 2 && " and "}
                {i === outdatedItems.length - 1 && " "}
              </span>
            ))}
            . Please review the changes.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {outdatedItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-colors"
                onClick={() => navigate({ to: item.path })}
              >
                View {item.label}
                <ChevronRight className="size-3" />
              </Link>
            ))}
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-amber-500/10 transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Hook to check if legal versions are outdated for the current user.
 * Can be used by other components to show custom UI.
 */
export function useLegalVersionsCheck() {
  const [result, setResult] = useState<{
    tosOutdated: boolean;
    privacyOutdated: boolean;
    loading: boolean;
  }>({ tosOutdated: false, privacyOutdated: false, loading: true });

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let active = true;

    const check = async (user: { uid: string } | null) => {
      if (!user) {
        if (active) setResult({ tosOutdated: false, privacyOutdated: false, loading: false });
        return;
      }
      try {
        const stored = await getUserLegalVersions(user.uid);
        const outdated = checkVersionsOutdated(stored, TOS_VERSION, PRIVACY_VERSION);
        if (active) setResult({ ...outdated, loading: false });
      } catch {
        if (active) setResult({ tosOutdated: false, privacyOutdated: false, loading: false });
      }
    };

    unsubscribe = onAuthStateChanged(auth, check);
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  return result;
}