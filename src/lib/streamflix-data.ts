import type { Movie } from "./types";
import {
  fetchTrending,
  fetchPopular,
  fetchNowPlaying,
  fetchTopRated,
  fetchUpcoming,
  fetchTrendingTv,
  fetchPopularTv,
  fetchTopRatedTv,
  fetchAiringTv,
  fetchMovie,
  fetchSimilar,
  fetchRecommendations,
  searchMovies,
  discoverByGenre,
  fetchMoviesByIds,
  searchPeople,
  fetchGenres,
} from "./api/tmdb";
import { fetchTraktTrending } from "./api/trakt";

export type { Movie };

export type BrowseKind = "home" | "movies" | "tv" | "new";

export const defaultProfiles = [
  { id: "p1", name: "Alex", color: "from-rose-500 to-red-700", kids: false },
  { id: "p2", name: "Jordan", color: "from-sky-500 to-indigo-700", kids: false },
  { id: "p3", name: "Sam", color: "from-amber-400 to-orange-600", kids: false },
  { id: "p4", name: "Kids", color: "from-emerald-400 to-teal-600", kids: true },
];

async function loadHome() {
  const [trending, popular, nowPlaying, topRated, sciFi, dramas, traktData] = await Promise.all([
    fetchTrending(),
    fetchPopular(),
    fetchNowPlaying(),
    fetchTopRated(),
    discoverByGenre({ data: { genreId: "878" } }),
    discoverByGenre({ data: { genreId: "18" } }),
    fetchTraktTrending(),
  ]);

  let recommendations: Movie[] = [];
  try {
    if (trending.length > 0) {
      recommendations = await fetchRecommendations({ data: { id: trending[0].id } });
    }
  } catch {}

  const traktIds = traktData.map((t: { tmdbId: string }) => t.tmdbId).slice(0, 8);
  let traktMovies: Movie[] = [];
  try {
    traktMovies = await fetchMoviesByIds({ data: { ids: traktIds } });
  } catch {}

  return {
    heroSlides: trending.slice(0, 5),
    rows: [
      { title: "Trending Now", items: trending.slice(0, 10) },
      ...(recommendations.length ? [{ title: "Recommended for You", items: recommendations }] : []),
      { title: "Top Rated", items: topRated.slice(0, 10) },
      { title: "Popular on StreamFlix", items: popular.slice(0, 10) },
      ...(traktMovies.length ? [{ title: "Trending on Trakt", items: traktMovies }] : []),
      { title: "Sci-Fi & Beyond", items: sciFi },
      { title: "Award-Winning Dramas", items: dramas.slice(0, 10) },
      { title: "New Releases", items: nowPlaying },
    ],
  };
}

async function loadMovies() {
  const [trending, popular, topRated, action, comedy, romance, horror] = await Promise.all([
    fetchTrending(),
    fetchPopular(),
    fetchTopRated(),
    discoverByGenre({ data: { genreId: "28" } }),
    discoverByGenre({ data: { genreId: "35" } }),
    discoverByGenre({ data: { genreId: "10749" } }),
    discoverByGenre({ data: { genreId: "27" } }),
  ]);
  return {
    heroSlides: popular.slice(0, 3),
    rows: [
      { title: "Trending Movies", items: trending },
      { title: "Popular Movies", items: popular },
      { title: "Critically Acclaimed", items: topRated },
      { title: "Action & Adventure", items: action },
      { title: "Laugh Out Loud", items: comedy },
      { title: "Romance", items: romance },
      { title: "Horror", items: horror },
    ],
  };
}

async function loadTv() {
  const [trending, popular, topRated, airing] = await Promise.all([
    fetchTrendingTv(),
    fetchPopularTv(),
    fetchTopRatedTv(),
    fetchAiringTv(),
  ]);
  return {
    heroSlides: trending.slice(0, 3),
    rows: [
      { title: "Trending TV", items: trending },
      { title: "Popular Shows", items: popular },
      { title: "Top Rated Series", items: topRated },
      { title: "On the Air Now", items: airing },
    ],
  };
}

async function loadNew() {
  const [nowPlaying, upcoming, trending, airing] = await Promise.all([
    fetchNowPlaying(),
    fetchUpcoming(),
    fetchTrending(),
    fetchAiringTv(),
  ]);
  return {
    heroSlides: upcoming.slice(0, 3),
    rows: [
      { title: "New Releases", items: nowPlaying },
      { title: "Coming Soon", items: upcoming },
      { title: "Trending This Week", items: trending },
      { title: "New TV Episodes", items: airing },
    ],
  };
}

export async function loadBrowseData(kind: BrowseKind = "home") {
  switch (kind) {
    case "movies":
      return loadMovies();
    case "tv":
      return loadTv();
    case "new":
      return loadNew();
    default:
      return loadHome();
  }
}

export async function movieById(id: string): Promise<Movie | null> {
  try {
    return await fetchMovie({ data: { id } });
  } catch {
    return null;
  }
}

export async function loadSimilar(id: string): Promise<Movie[]> {
  try {
    return await fetchSimilar({ data: { id } });
  } catch {
    return [];
  }
}

export async function loadRecommendations(id: string): Promise<Movie[]> {
  try {
    return await fetchRecommendations({ data: { id } });
  } catch {
    return [];
  }
}

export async function search(query: string): Promise<Movie[]> {
  try {
    return await searchMovies({ data: { query } });
  } catch {
    return [];
  }
}

export async function searchByGenre(genreId: string): Promise<Movie[]> {
  try {
    return await discoverByGenre({ data: { genreId } });
  } catch {
    return [];
  }
}

export async function searchByPerson(query: string) {
  try {
    return await searchPeople({ data: { query } });
  } catch {
    return [];
  }
}

export async function getGenres() {
  try {
    return await fetchGenres();
  } catch {
    return [];
  }
}
