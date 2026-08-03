import { getServerConfig } from "../config.server";
import type { Movie } from "../types";

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/";

export async function tmdbFetch(path: string, params: Record<string, string> = {}) {
  const { tmdbApiKey } = getServerConfig();
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", tmdbApiKey);
  url.searchParams.set("language", "en-US");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB error ${res.status}`);
  return res.json();
}

export async function fetchMovieVideosData(id: string): Promise<string | null> {
  const data = await tmdbFetch(`/movie/${id.replace(/^tv-/, "")}/videos`);
  const trailer = (data.results || []).find(
    (v: any) => v.type === "Trailer" && v.site === "YouTube",
  );
  return trailer?.key ?? null;
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
    rating: "TV-MA",
    runtime: m.runtime ? `${Math.floor(m.runtime / 60)}h ${m.runtime % 60}m` : "2h",
    genres: (m.genres || []).map((g: any) => g.name),
    genreIds: m.genre_ids || (m.genres || []).map((g: any) => g.id),
    poster: m.poster_path ? `${IMG_BASE}w500${m.poster_path}` : "",
    backdrop: m.backdrop_path ? `${IMG_BASE}original${m.backdrop_path}` : "",
    backdropSm: m.backdrop_path ? `${IMG_BASE}w1280${m.backdrop_path}` : "",
    trailer: trailer
      ? `https://www.youtube.com/watch?v=${trailer.key}`
      : "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    cast: cast.length ? cast : ["Unknown"],
    castPfp: castPfp,
    castRoles: castRoles,
    castIds: castIds,
    director,
    directorId,
    match: m.vote_average ? Math.round(m.vote_average * 10) : 85,
  };
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
    rating: "TV-MA",
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
    trailer: trailer
      ? `https://www.youtube.com/watch?v=${trailer.key}`
      : "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    cast: cast.length ? cast : ["Unknown"],
    castPfp: castPfp,
    castRoles: castRoles,
    castIds: castIds,
    director: creator,
    directorId,
    match: m.vote_average ? Math.round(m.vote_average * 10) : 85,
    numberOfSeasons: m.number_of_seasons ?? undefined,
    numberOfEpisodes: m.number_of_episodes ?? undefined,
  };
}
