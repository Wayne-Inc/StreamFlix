import type { Movie } from "./types";
import {
  fetchTrending,
  fetchTrendingAllWeek,
  fetchTrendingAllDay,
  fetchPopular,
  fetchNowPlaying,
  fetchTopRated,
  fetchTopRatedTv,
  fetchUpcoming,
  fetchUpcomingTv,
  fetchNewMovies,
  fetchPopularUpcoming,
  fetchPopularUpcomingTv,
  fetchTrendingTv,
  fetchPopularTv,
  fetchAiringTv,
  fetchMovie,
  fetchSimilar,
  fetchRecommendations,
  searchMovies,
  discoverByGenre,
  discoverByGenreMixed,
  searchPeople,
  fetchGenres,
  searchFiltered as searchFilteredFn,
  suggestTitles as suggestTitlesFn,
  type SearchFilterInput,
  type SearchSort,
  fetchUpcomingCalendar,
  fetchAiringCalendar,
  enrichCertifications as enrichCertificationsFn,
} from "./api/tmdb";

export type { Movie };

export type BrowseKind = "home" | "movies" | "tv" | "new";

export const defaultProfiles = [
  { id: "p1", name: "Alex", color: "from-rose-500 to-red-700", kids: false },
  { id: "p2", name: "Jordan", color: "from-sky-500 to-indigo-700", kids: false },
  { id: "p3", name: "Sam", color: "from-amber-400 to-orange-600", kids: false },
  { id: "p4", name: "Kids", color: "from-emerald-400 to-teal-600", kids: true },
];

const HOME_GENRES = [
  { id: "28", name: "Action" },
  { id: "12", name: "Adventure" },
  { id: "16", name: "Animation" },
  { id: "35", name: "Comedy" },
  { id: "80", name: "Crime" },
  { id: "99", name: "Documentary" },
  { id: "18", name: "Drama" },
  { id: "10751", name: "Family" },
  { id: "14", name: "Fantasy" },
  { id: "36", name: "History" },
  { id: "27", name: "Horror" },
  { id: "10402", name: "Music" },
  { id: "9648", name: "Mystery" },
  { id: "10749", name: "Romance" },
  { id: "878", name: "Sci-Fi" },
  { id: "53", name: "Thriller" },
  { id: "10752", name: "War" },
  { id: "37", name: "Western" },
];

async function loadHome() {
  const [
    trendingAllWeek,
    nowPlaying,
    topRated,
    topRatedTv,
    trendingAllDay,
    ...genreItems
  ] = await Promise.all([
    fetchTrendingAllWeek(),
    fetchNowPlaying(),
    fetchTopRated(),
    fetchTopRatedTv(),
    fetchTrendingAllDay(),
    ...HOME_GENRES.map((g) => discoverByGenreMixed({ data: { genreId: g.id } })),
  ]);

  let recommendations: Movie[] = [];
  try {
    if (trendingAllWeek.length > 0) {
      recommendations = await fetchRecommendations({ data: { id: trendingAllWeek[0].id } });
    }
  } catch {}

  const top10Today = trendingAllDay.slice(0, 10);

  const genreGroups = HOME_GENRES.map((g, i) => ({ id: g.id, name: g.name, items: genreItems[i] }));

  return {
    heroSlides: await enrichCertificationsFn({ data: { items: trendingAllWeek.slice(0, 5) } }),
    top10Today,
    genreGroups,
    rows: [
      { title: "Trending Now", items: trendingAllWeek },
      ...(recommendations.length ? [{ title: "Recommended for You", items: recommendations }] : []),
      { title: "Top Rated", items: [...topRated, ...topRatedTv].slice(0, 10) },
      { title: "New Releases", items: nowPlaying },
    ],
  };
}

async function loadMovies() {
  const [
    trending,
    popular,
    topRated,
    action,
    comedy,
    romance,
    horror,
    animation,
    documentary,
  ] = await Promise.all([
    fetchTrending(),
    fetchPopular(),
    fetchTopRated(),
    discoverByGenre({ data: { genreId: "28" } }),
    discoverByGenre({ data: { genreId: "35" } }),
    discoverByGenre({ data: { genreId: "10749" } }),
    discoverByGenre({ data: { genreId: "27" } }),
    discoverByGenre({ data: { genreId: "16" } }),
    discoverByGenre({ data: { genreId: "99" } }),
  ]);
  return {
    heroSlides: await enrichCertificationsFn({ data: { items: popular.slice(0, 3) } }),
    top10Today: [],
    genreGroups: [],
    rows: [
      { title: "Trending Movies", items: trending },
      { title: "Popular Movies", items: popular },
      { title: "Critically Acclaimed", items: topRated },
      { title: "Action & Adventure", items: action },
      { title: "Laugh Out Loud", items: comedy },
      { title: "Romance", items: romance },
      { title: "Animation & Family", items: animation },
      { title: "Horror", items: horror },
      { title: "Documentaries", items: documentary },
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
    heroSlides: await enrichCertificationsFn({ data: { items: trending.slice(0, 3) } }),
    top10Today: [],
    genreGroups: [],
    rows: [
      { title: "Trending TV", items: trending },
      { title: "Popular Shows", items: popular },
      { title: "Top Rated Series", items: topRated },
      { title: "On the Air Now", items: airing },
    ],
  };
}

async function loadNew() {
  const [nowPlaying, upcoming, upcomingTv, trending, airing, newMovies, popularUpcoming, popularTv] =
    await Promise.all([
      fetchNowPlaying(),
      fetchUpcoming(),
      fetchUpcomingTv(),
      fetchTrendingAllWeek(),
      fetchAiringTv(),
      fetchNewMovies(),
      fetchPopularUpcoming(),
      fetchPopularUpcomingTv(),
    ]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const seen = new Set<string>();
  const pool = [
    ...((popularUpcoming as Movie[]).length ? popularUpcoming : (upcoming as Movie[])),
    ...((popularTv as Movie[]).length ? popularTv : (upcomingTv as Movie[])),
  ].filter((m) => {
    if (!m.id || seen.has(String(m.id))) return false;
    seen.add(String(m.id));
    return true;
  });
  const comingSoon = pool
    .filter((m) => m.releaseDate && m.releaseDate >= todayStr)
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0) || (a.releaseDate ?? "").localeCompare(b.releaseDate ?? ""))
    .slice(0, 24);

  const featured = (popularUpcoming as Movie[]).length
    ? popularUpcoming
    : comingSoon;

  return {
    heroSlides: await enrichCertificationsFn({ data: { items: featured.slice(0, 3) } }),
    top10Today: [],
    genreGroups: [],
    rows: [
      {
        title: "New Movies",
        items: featured.length
          ? featured
          : newMovies.length
            ? newMovies
            : nowPlaying,
      },
      { title: "Coming Soon", items: comingSoon },
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

export async function searchWithFilters(filters: SearchFilterInput): Promise<Movie[]> {
  try {
    return await searchFilteredFn({ data: filters });
  } catch {
    return [];
  }
}

export async function suggestTitles(query: string) {
  try {
    return await suggestTitlesFn({ data: { query } });
  } catch {
    return [];
  }
}

export type { SearchFilterInput, SearchSort };

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

export async function loadUpcomingCalendar() {
  try {
    return await fetchUpcomingCalendar();
  } catch {
    return [];
  }
}

export async function loadAiringCalendar() {
  try {
    return await fetchAiringCalendar();
  } catch {
    return [];
  }
}
