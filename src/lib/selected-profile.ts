export type SelectedProfile = {
  id: string;
  name: string;
  color: string;
  avatarUrl?: string;
  kids: boolean;
  contentRatingLimit?: "G" | "PG" | "PG-13" | "R" | "NC-17" | "TV-Y" | "TV-Y7" | "TV-G" | "TV-PG" | "TV-14" | "TV-MA";
};

const KEY = "sf:selectedProfile";
const PERSIST_KEY = "sf:selectedProfile:persist";

export function getSelectedProfile(): SelectedProfile | null {
  if (typeof window === "undefined") return null;
  try {
    // First check sessionStorage (current session)
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.id === "string") return parsed as SelectedProfile;
    }
    // Fallback to localStorage (persisted across sessions)
    const persisted = window.localStorage.getItem(PERSIST_KEY);
    if (persisted) {
      const parsed = JSON.parse(persisted);
      if (parsed && typeof parsed.id === "string") {
        // Restore to sessionStorage for this session
        window.sessionStorage.setItem(KEY, persisted);
        return parsed as SelectedProfile;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function getSelectedProfileId(): string | null {
  return getSelectedProfile()?.id ?? null;
}

export function setSelectedProfile(profile: SelectedProfile): void {
  try {
    const serialized = JSON.stringify(profile);
    window.sessionStorage.setItem(KEY, serialized);
    window.localStorage.setItem(PERSIST_KEY, serialized);
  } catch {
    // Storage unavailable (private mode) — ignore.
  }
}

export function clearSelectedProfile(): void {
  try {
    window.sessionStorage.removeItem(KEY);
    window.localStorage.removeItem(PERSIST_KEY);
  } catch {
    // Storage unavailable (private mode) — ignore.
  }
}
