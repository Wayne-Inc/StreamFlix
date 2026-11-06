/**
 * Keys persisted to localStorage by StreamFlix. All of them are user- or
 * device-specific and should be wiped when a user signs off so no personal
 * data lingers on a shared device for the next account.
 */
const LOCAL_STORAGE_KEYS = [
  "sf:auth",
  "sf:vip",
  "sf:saveData",
  "sf:upgrade_password",
  "sf:github_prompt",
  "sf:onboarded",
  "sf:embedServer",
  "sf:autoplayNext",
  "sf:spatialNav",
  "sf:reduceMotion",
  "sf:selectedProfile:persist",
  "streamflix:cookieConsent",
  "streamflix_device_id",
];

// Watch history is stored per-account under keys like
// `streamflix:watch_history:<uid>`.
const WATCH_HISTORY_PREFIX = "streamflix:watch_history";

/**
 * Remove every StreamFlix key from localStorage. Safe to call outside the
 * browser (returns early) and in private mode (errors are swallowed).
 */
export function clearStreamFlixLocalStorage(): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of LOCAL_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(WATCH_HISTORY_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Storage unavailable (e.g. private mode) — ignore.
  }
}
