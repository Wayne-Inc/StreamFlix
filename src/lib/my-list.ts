import type { Movie } from "./types";
import { getSelectedProfileId } from "./continue-watching";

export type MyListEntry = {
  id: string;
  addedAt: number;
  movie: Movie;
};

export const MY_LIST_EVENT = "sf:my-list-updated";

function getKey(): string {
  const profileId = getSelectedProfileId();
  return profileId ? `streamflix:my_list_${profileId}` : "streamflix:my_list";
}

export function getMyList(): MyListEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(getKey());
    if (!raw) return [];
    const list = JSON.parse(raw) as MyListEntry[];
    return list.sort((a, b) => b.addedAt - a.addedAt);
  } catch {
    return [];
  }
}

export function isInMyList(id: string): boolean {
  return getMyList().some((e) => e.id === id);
}

export function toggleMyList(movie: Movie): boolean {
  const key = getKey();
  const current = getMyList();
  const exists = current.some((e) => e.id === movie.id);
  const list = exists
    ? current.filter((e) => e.id !== movie.id)
    : [{ id: movie.id, addedAt: Date.now(), movie }, ...current];
  window.localStorage.setItem(key, JSON.stringify(list));
  window.dispatchEvent(new Event(MY_LIST_EVENT));
  return !exists;
}

export function removeFromMyList(id: string) {
  const key = getKey();
  const list = getMyList().filter((e) => e.id !== id);
  window.localStorage.setItem(key, JSON.stringify(list));
  window.dispatchEvent(new Event(MY_LIST_EVENT));
}
