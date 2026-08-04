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

export function isRatingBlockedForKids(rating: string): boolean {
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

export function filterKidsContent(items: Movie[]): Movie[] {
  return items.filter((m) => !isRatingBlockedForKids(m.rating));
}
