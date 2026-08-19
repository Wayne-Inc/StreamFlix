import type { Movie } from "./types";
import { fetchRecommendations, discoverByGenre } from "./api/tmdb";

export type RecommendSeed = {
  id: string;
  title?: string;
  watchedAt: number;
  genreIds?: number[];
};

const MAX_SEEDS = 8;
const MAX_RECS = 20;

function recencyWeight(index: number, total: number) {
  if (total <= 1) return 1;
  return 1 - (index / total) * 0.6;
}

const GENRE_LABELS: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

function computeGenreAffinity(seeds: RecommendSeed[]): Map<number, number> {
  const affinity = new Map<number, number>();
  for (const seed of seeds) {
    const recency = seed.watchedAt;
    for (const gid of seed.genreIds ?? []) {
      const existing = affinity.get(gid) ?? 0;
      affinity.set(gid, existing + 1 + (recency > Date.now() - 7 * 24 * 60 * 60 * 1000 ? 0.5 : 0));
    }
  }
  return affinity;
}

function diversityBoost(rank: number, genreCounts: Map<number, number>): number {
  return 1 + rank * 0.1;
}

export async function getPersonalizedRecommendations(seeds: RecommendSeed[]): Promise<{
  items: Movie[];
  basedOnTitle: string | null;
  reasons: Record<string, string>;
  reasonLinks: Record<string, string>;
}> {
  if (seeds.length === 0)
    return { items: [], basedOnTitle: null, reasons: {}, reasonLinks: {} };

  const sorted = [...seeds].sort((a, b) => b.watchedAt - a.watchedAt);
  const top = sorted.slice(0, MAX_SEEDS);
  const seen = new Set(sorted.map((s) => s.id));
  const scores = new Map<
    string,
    {
      movie: Movie;
      score: number;
      count: number;
      firstPos: number;
      seedScores: Map<string, number>;
      seedIds: Map<string, string>;
      genreOverlap: number;
    }
  >();

  const genreAffinity = computeGenreAffinity(seeds);
  const topGenreIds = Array.from(genreAffinity.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([gid]) => gid);

  const results = await Promise.all(
    top.map((seed) => fetchRecommendations({ data: { id: seed.id } }).catch(() => [] as Movie[])),
  );

  let basedOnTitle: string | null = null;
  let firstPos = 0;
  top.forEach((seed, i) => {
    if (results[i].length > 0 && basedOnTitle == null) {
      basedOnTitle = seed.title ?? null;
    }
    const rw = recencyWeight(i, top.length);
    results[i].forEach((movie: Movie, j: number) => {
      if (seen.has(movie.id)) return;
      const pos = 1 - (j / 10) * 0.5;
      const contribution = rw * pos;

      const movieGenreOverlap = (movie.genreIds ?? []).reduce((sum, gid) => {
        return sum + (genreAffinity.get(gid) ?? 0);
      }, 0);

      const seedTitle = seed.title ?? seed.id;
      const entry = scores.get(movie.id);
      if (entry) {
        entry.score += contribution;
        entry.count += 1;
        entry.seedScores.set(seedTitle, (entry.seedScores.get(seedTitle) ?? 0) + contribution);
        entry.seedIds.set(seedTitle, seed.id);
        entry.genreOverlap = Math.max(entry.genreOverlap, movieGenreOverlap);
      } else {
        const seedScores = new Map<string, number>();
        seedScores.set(seedTitle, contribution);
        const seedIds = new Map<string, string>();
        seedIds.set(seedTitle, seed.id);
        scores.set(movie.id, {
          movie,
          score: contribution,
          count: 1,
          firstPos: firstPos++,
          seedScores,
          seedIds,
          genreOverlap: movieGenreOverlap,
        });
      }
    });
  });

  const ranked = Array.from(scores.values())
    .sort((a, b) => {
      const scoreA = a.score * (1 + a.genreOverlap * 0.15) * (a.count > 1 ? 1.2 : 1);
      const scoreB = b.score * (1 + b.genreOverlap * 0.15) * (b.count > 1 ? 1.2 : 1);
      return scoreB - scoreA || a.firstPos - b.firstPos;
    })
    .map((e) => e.movie)
    .slice(0, MAX_RECS);

  const reasons: Record<string, string> = {};
  const reasonLinks: Record<string, string> = {};

  if (ranked.length < MAX_RECS) {
    const genreCounts = new Map<number, number>();
    for (const s of seeds) {
      for (const g of s.genreIds ?? []) genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
    }
    const topGenres = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([gid]) => String(gid));
    const seenFilled = new Set(ranked.map((m) => m.id));
    for (const gid of topGenres) {
      if (ranked.length >= MAX_RECS) break;
      const batch = await discoverByGenre({ data: { genreId: gid } }).catch(() => [] as Movie[]);
      for (const movie of batch) {
        if (seen.has(movie.id) || seenFilled.has(movie.id)) continue;
        seenFilled.add(movie.id);
        const label = GENRE_LABELS[Number(gid)] ?? "this genre";
        reasons[movie.id] = `Because you like ${label}`;
        ranked.push(movie);
        if (ranked.length >= MAX_RECS) break;
      }
    }
  }

  for (const movie of ranked) {
    if (reasons[movie.id]) continue;
    const entry = scores.get(movie.id);
    if (!entry) continue;
    const best = Array.from(entry.seedScores.entries()).sort((a, b) => b[1] - a[1])[0];
    if (best) {
      reasons[movie.id] = `Because you watched ${best[0]}`;
      const sourceId = entry.seedIds.get(best[0]);
      if (sourceId) reasonLinks[movie.id] = sourceId;
    }
  }

  return { items: ranked, basedOnTitle, reasons, reasonLinks };
}
