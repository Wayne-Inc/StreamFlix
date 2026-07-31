import type { Movie } from "./types";
import { fetchRecommendations, discoverByGenre } from "./api/tmdb";

export type RecommendSeed = {
  id: string;
  watchedAt: number;
  genreIds?: number[];
};

const MAX_SEEDS = 5;
const MAX_RECS = 12;

function recencyWeight(index: number, total: number) {
  if (total <= 1) return 1;
  return 1 - (index / total) * 0.6;
}

export async function getPersonalizedRecommendations(seeds: RecommendSeed[]): Promise<Movie[]> {
  if (seeds.length === 0) return [];

  const sorted = [...seeds].sort((a, b) => b.watchedAt - a.watchedAt);
  const top = sorted.slice(0, MAX_SEEDS);
  const seen = new Set(sorted.map((s) => s.id));
  const scores = new Map<
    string,
    { movie: Movie; score: number; count: number; firstPos: number }
  >();

  const results = await Promise.all(
    top.map((seed) => fetchRecommendations({ data: { id: seed.id } }).catch(() => [] as Movie[])),
  );

  let firstPos = 0;
  top.forEach((seed, i) => {
    const rw = recencyWeight(i, top.length);
    results[i].forEach((movie: Movie, j: number) => {
      if (seen.has(movie.id)) return;
      const pos = 1 - (j / 10) * 0.5;
      const entry = scores.get(movie.id);
      if (entry) {
        entry.score += rw * pos;
        entry.count += 1;
      } else {
        scores.set(movie.id, { movie, score: rw * pos, count: 1, firstPos: firstPos++ });
      }
    });
  });

  const ranked = Array.from(scores.values())
    .sort((a, b) => b.score - a.score || a.firstPos - b.firstPos)
    .map((e) => e.movie)
    .slice(0, MAX_RECS);

  if (ranked.length < MAX_RECS) {
    const genreCounts = new Map<number, number>();
    for (const s of seeds) {
      for (const g of s.genreIds ?? []) genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
    }
    const topGenres = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([gid]) => String(gid));
    const seenFilled = new Set(ranked.map((m) => m.id));
    for (const gid of topGenres) {
      if (ranked.length >= MAX_RECS) break;
      const batch = await discoverByGenre({ data: { genreId: gid } }).catch(() => [] as Movie[]);
      for (const movie of batch) {
        if (seen.has(movie.id) || seenFilled.has(movie.id)) continue;
        seenFilled.add(movie.id);
        ranked.push(movie);
        if (ranked.length >= MAX_RECS) break;
      }
    }
  }

  return ranked;
}
