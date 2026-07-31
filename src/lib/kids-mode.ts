import type { Movie } from "./types";

const ADULT_GENRE_IDS = new Set([
  27, // Horror
  53, // Thriller
  80, // Crime
  9648, // Mystery
  10752, // War
  10749, // Romance
]);

export function isKidsProfile(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("sf:selectedProfile");
    if (!raw) return false;
    return JSON.parse(raw).kids ?? false;
  } catch {
    return false;
  }
}

export function filterKidsContent(items: Movie[]): Movie[] {
  return items.filter((m) => {
    const ids = m.genreIds ?? [];
    const hasAdult = ids.some((gid) => ADULT_GENRE_IDS.has(gid));
    return !hasAdult;
  });
}
