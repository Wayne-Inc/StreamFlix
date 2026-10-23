import type { Movie } from "./types";
import { getSelectedProfileId } from "./continue-watching";
import { setMyListInFirestore, removeMyListFromFirestore } from "./my-list-firestore";

export type MyListEntry = {
  id: string;
  addedAt: number;
  movie: Movie;
};

export const MY_LIST_EVENT = "sf:my-list-updated";

const REMOVAL_TOMBSTONE_MS = 15_000;
const recentlyRemoved = new Map<string, number>();

function markRemoved(id: string) {
  recentlyRemoved.set(id, Date.now());
}

function markAdded(id: string) {
  recentlyRemoved.delete(id);
}

export function wasRecentlyRemoved(id: string): boolean {
  const removedAt = recentlyRemoved.get(id);
  if (!removedAt) return false;
  if (Date.now() - removedAt > REMOVAL_TOMBSTONE_MS) {
    recentlyRemoved.delete(id);
    return false;
  }
  return true;
}

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
  if (exists) markRemoved(movie.id);
  else markAdded(movie.id);
  window.dispatchEvent(new Event(MY_LIST_EVENT));
  setMyListInFirestore(movie, !exists).catch(() => {});
  return !exists;
}

export function removeFromMyList(id: string) {
  const key = getKey();
  const list = getMyList().filter((e) => e.id !== id);
  window.localStorage.setItem(key, JSON.stringify(list));
  markRemoved(id);
  window.dispatchEvent(new Event(MY_LIST_EVENT));
  removeMyListFromFirestore(id).catch(() => {});
}
