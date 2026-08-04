import type { Movie } from "./types";

const RATING_TIERS: Record<string, number> = {
  G: 0,
  "TV-G": 0,
  PG: 1,
  "TV-PG": 1,
  "PG-13": 2,
  "TV-14": 2,
  R: 3,
  "TV-MA": 3,
  "NC-17": 3,
  NR: 2,
};

const KIDS_MAX_TIER = 1;

const UNSAFE_GENRE_IDS = new Set([27, 53, 10752]);

export function isRatingBlockedForKids(rating: string | undefined): boolean {
  if (!rating) return false;
  const tier = RATING_TIERS[rating.toUpperCase()] ?? 2;
  return tier > KIDS_MAX_TIER;
}

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

export function isGenreBlockedForKids(genreIds: number[]): boolean {
  return genreIds.some((gid) => UNSAFE_GENRE_IDS.has(gid));
}

export function filterKidsContent(items: Movie[]): Movie[] {
  return items.filter((m) => {
    if (isRatingBlockedForKids(m.rating)) return false;
    if (isGenreBlockedForKids(m.genreIds ?? [])) return false;
    return true;
  });
}
