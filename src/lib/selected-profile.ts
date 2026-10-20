export type SelectedProfile = {
  id: string;
  name: string;
  color: string;
  avatarUrl?: string;
  kids: boolean;
};

const KEY = "sf:selectedProfile";

export function getSelectedProfile(): SelectedProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.id !== "string") return null;
    return parsed as SelectedProfile;
  } catch {
    return null;
  }
}

export function getSelectedProfileId(): string | null {
  return getSelectedProfile()?.id ?? null;
}

export function setSelectedProfile(profile: SelectedProfile): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(profile));
    window.localStorage.removeItem(KEY);
  } catch {
    // Storage unavailable (private mode) — ignore.
  }
}

export function clearSelectedProfile(): void {
  try {
    window.sessionStorage.removeItem(KEY);
    window.localStorage.removeItem(KEY);
  } catch {
    // Storage unavailable (private mode) — ignore.
  }
}
