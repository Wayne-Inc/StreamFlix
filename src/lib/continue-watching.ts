import type { Movie } from "./types";

const KEY = "streamflix:continue-watching";
const HISTORY_KEY = "streamflix:watch-history";
const MAX = 12;
const HISTORY_MAX = 50;

export type ContinueItem = {
  id: string;
  title: string;
  poster: string;
  backdrop: string;
  rating: string;
  runtime: string;
  genres: string[];
  genreIds: number[];
  match: number;
  description: string;
  year: number;
  cast: string[];
  castPfp: string[];
  director: string;
  directorId: string;
  progress: number;
  duration: number;
  updatedAt: number;
  season?: number;
  episode?: number;
  episodeLabel?: string;
};

export type WatchHistoryItem = ContinueItem & {
  watchedAt: number;
};

function getSelectedProfileId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("sf:selectedProfile");
    if (!raw) return null;
    return JSON.parse(raw).id ?? null;
  } catch {
    return null;
  }
}

function getKey(): string {
  const profileId = getSelectedProfileId();
  return profileId ? `streamflix:continue_${profileId}` : KEY;
}

function getHistoryKey(): string {
  const profileId = getSelectedProfileId();
  return profileId ? `streamflix:watch_history_${profileId}` : HISTORY_KEY;
}

function makeContinueId(movieId: string, season?: number, episode?: number) {
  return season != null && episode != null ? `${movieId}:S${season}E${episode}` : movieId;
}

export function getContinueWatching(): ContinueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(getKey());
    if (!raw) return [];
    const list = JSON.parse(raw) as ContinueItem[];
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function getWatchHistory(): WatchHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(getHistoryKey());
    if (!raw) return [];
    const list = JSON.parse(raw) as WatchHistoryItem[];
    return list.sort((a, b) => b.watchedAt - a.watchedAt);
  } catch {
    return [];
  }
}

function saveHistoryItem(item: WatchHistoryItem) {
  if (typeof window === "undefined") return;
  const list = getWatchHistory().filter((x) => x.id !== item.id);
  list.unshift(item);
  window.localStorage.setItem(getHistoryKey(), JSON.stringify(list.slice(0, HISTORY_MAX)));
}

export function recordWatchHistory(
  movie: Movie,
  progress: number,
  duration: number,
  season?: number,
  episode?: number,
) {
  if (typeof window === "undefined") return;
  if (!duration || !isFinite(duration)) return;
  const ratio = progress / duration;
  if (ratio < 0.95 || progress <= 5) return;

  saveHistoryItem({
    id: makeContinueId(movie.id, season, episode),
    title: movie.title,
    poster: movie.poster,
    backdrop: movie.backdrop,
    rating: movie.rating,
    runtime: movie.runtime,
    genres: movie.genres,
    genreIds: movie.genreIds,
    match: movie.match,
    description: movie.description,
    year: movie.year,
    cast: movie.cast,
    castPfp: movie.castPfp,
    director: movie.director,
    directorId: movie.directorId,
    progress,
    duration,
    updatedAt: Date.now(),
    watchedAt: Date.now(),
    season,
    episode,
    episodeLabel: season != null && episode != null ? `S${season}E${episode}` : undefined,
  });
}

export function recordProgress(
  movie: Movie,
  progress: number,
  duration: number,
  season?: number,
  episode?: number,
) {
  if (typeof window === "undefined") return;
  if (!duration || !isFinite(duration)) return;
  const ratio = progress / duration;
  const itemId = makeContinueId(movie.id, season, episode);
  const list = getContinueWatching().filter((x) => x.id !== itemId);

  if (ratio < 0.95 && progress > 5) {
    list.unshift({
      id: itemId,
      title: movie.title,
      poster: movie.poster,
      backdrop: movie.backdrop,
      rating: movie.rating,
      runtime: movie.runtime,
      genres: movie.genres,
      genreIds: movie.genreIds,
      match: movie.match,
      description: movie.description,
      year: movie.year,
      cast: movie.cast,
      castPfp: movie.castPfp,
      director: movie.director,
      directorId: movie.directorId,
      progress,
      duration,
      updatedAt: Date.now(),
      season,
      episode,
      episodeLabel: season != null && episode != null ? `S${season}E${episode}` : undefined,
    });
  } else if (ratio >= 0.95 && progress > 5) {
    recordWatchHistory(movie, progress, duration, season, episode);
  }

  window.localStorage.setItem(getKey(), JSON.stringify(list.slice(0, MAX)));
}

export function removeContinue(id: string) {
  if (typeof window === "undefined") return;
  const list = getContinueWatching().filter((x) => x.id !== id);
  window.localStorage.setItem(getKey(), JSON.stringify(list));
}

export function toMovie(item: ContinueItem): Movie {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    year: item.year,
    rating: item.rating,
    runtime: item.runtime,
    genres: item.genres,
    genreIds: item.genreIds,
    poster: item.poster,
    backdrop: item.backdrop,
    cast: item.cast,
    castPfp: item.castPfp,
    director: item.director,
    directorId: item.directorId,
    match: item.match,
  };
}
