import { getServerConfig } from "../config.server";
import type { Movie } from "../types";

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/";

export async function tmdbFetch(path: string, params: Record<string, string> = {}) {
  const { tmdbApiKey } = getServerConfig();
  const url = new URL(`${TMDB_BASE}${path}`);
  if (tmdbApiKey) {
    url.searchParams.set("api_key", tmdbApiKey);
  }
  url.searchParams.set("language", "en-US");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      console.warn(`TMDB error ${res.status} for ${path}`);
      return { results: [], genres: [] };
    }
    return res.json();
  } catch (err) {
    console.warn(`TMDB fetch failed for ${path}:`, err);
    return { results: [], genres: [] };
  }
}

export async function fetchMovieVideosData(id: string): Promise<string | null> {
  const data = await tmdbFetch(`/movie/${id.replace(/^tv-/, "")}/videos`);
  const trailer = (data.results || []).find(
    (v: any) => v.type === "Trailer" && v.site === "YouTube",
  );
  return trailer?.key ?? null;
}

function extractCertification(m: any, country = "US"): string {
  const source = m.release_dates?.results ?? m.content_ratings?.results ?? [];
  const entry = source.find((r: any) => r.iso_3166_1 === country) ?? source[0];
  const cert = entry?.release_dates?.[0]?.certification ?? entry?.rating ?? "";
  return cert;
}

export function toMovie(m: any): Movie {
  const credits = m.credits;
  const castRaw = (credits?.cast || []).slice(0, 20);
  const cast = castRaw.map((c: any) => c.name);
  const castPfp = castRaw.map((c: any) =>
    c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : "",
  );
  const castRoles = castRaw.map((c: any) => c.character || "");
  const castIds = castRaw.map((c: any) => String(c.id));
  const dirCredit = (credits?.crew || []).find((c: any) => c.job === "Director");
  const director = dirCredit?.name || "Unknown";
  const directorId = dirCredit ? String(dirCredit.id) : "";
  const trailer = (m.videos?.results || []).find(
    (v: any) => v.type === "Trailer" && v.site === "YouTube",
  );

  return {
    id: String(m.id),
    title: m.title,
    description: m.overview || "No description available.",
    year: m.release_date ? new Date(m.release_date).getFullYear() : new Date().getFullYear(),
    rating: extractCertification(m),
    runtime: m.runtime ? `${Math.floor(m.runtime / 60)}h ${m.runtime % 60}m` : "2h",
    genres: (m.genres || []).map((g: any) => g.name),
    genreIds: m.genre_ids || (m.genres || []).map((g: any) => g.id),
    poster: m.poster_path ? `${IMG_BASE}w500${m.poster_path}` : "",
    backdrop: m.backdrop_path ? `${IMG_BASE}original${m.backdrop_path}` : "",
    backdropSm: m.backdrop_path ? `${IMG_BASE}w1280${m.backdrop_path}` : "",
    trailer: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : undefined,
    cast: cast.length ? cast : ["Unknown"],
    castPfp: castPfp,
    castRoles: castRoles,
    castIds: castIds,
    director,
    directorId,
    match: m.vote_average ? Math.round(m.vote_average * 10) : 0,
    score: m.vote_average ? Number(m.vote_average.toFixed(1)) : undefined,
  };
}

export async function enrichCertifications(items: Movie[]): Promise<Movie[]> {
  const needIds = items.filter(m => !m.rating && !m.id.startsWith("tv-")).map(m => m.id);
  if (!needIds.length) return items;

  const details = await Promise.allSettled(
    needIds.map(id =>
      tmdbFetch(`/movie/${id}`, { append_to_response: "release_dates" }).then(r => ({
        id,
        cert: extractCertification(r),
      }))
    ),
  );

  const certMap = new Map<string, string>();
  for (const d of details) {
    if (d.status === "fulfilled") certMap.set(d.value.id, d.value.cert);
  }

  return items.map(m =>
    certMap.has(m.id) ? { ...m, rating: certMap.get(m.id)! } : m
  );
}

export function toTv(m: any): Movie {
  const credits = m.credits;
  const castRaw = (credits?.cast || []).slice(0, 20);
  const cast = castRaw.map((c: any) => c.name);
  const castPfp = castRaw.map((c: any) =>
    c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : "",
  );
  const castRoles = castRaw.map((c: any) => c.character || "");
  const castIds = castRaw.map((c: any) => String(c.id));
  const tvDir = m.created_by?.[0] || (credits?.crew || []).find((c: any) => c.job === "Director");
  const creator = tvDir?.name || "Unknown";
  const directorId = tvDir ? String(tvDir.id) : "";
  const trailer = (m.videos?.results || []).find(
    (v: any) => v.type === "Trailer" && v.site === "YouTube",
  );
  const epRuntime = Array.isArray(m.episode_run_time) ? m.episode_run_time[0] : null;
  return {
    id: `tv-${m.id}`,
    title: m.name || m.original_name || "Untitled",
    description: m.overview || "No description available.",
    year: m.first_air_date ? new Date(m.first_air_date).getFullYear() : new Date().getFullYear(),
    rating: extractCertification(m),
    runtime: epRuntime
      ? `${epRuntime}m / ep`
      : m.number_of_seasons
        ? `${m.number_of_seasons} season${m.number_of_seasons > 1 ? "s" : ""}`
        : "Series",
    genres: (m.genres || []).map((g: any) => g.name),
    genreIds: m.genre_ids || (m.genres || []).map((g: any) => g.id),
    poster: m.poster_path ? `${IMG_BASE}w500${m.poster_path}` : "",
    backdrop: m.backdrop_path ? `${IMG_BASE}original${m.backdrop_path}` : "",
    backdropSm: m.backdrop_path ? `${IMG_BASE}w1280${m.backdrop_path}` : "",
    trailer: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : undefined,
    cast: cast.length ? cast : ["Unknown"],
    castPfp: castPfp,
    castRoles: castRoles,
    castIds: castIds,
    director: creator,
    directorId,
    match: m.vote_average ? Math.round(m.vote_average * 10) : 0,
    score: m.vote_average ? Number(m.vote_average.toFixed(1)) : undefined,
    numberOfSeasons: m.number_of_seasons ?? undefined,
    numberOfEpisodes: m.number_of_episodes ?? undefined,
  };
}
