import type { Movie } from "./types";
import {
  fetchTrending,
  fetchTrendingDay,
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
  fetchTrendingTvDay,
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
  enrichRuntimes as enrichRuntimesFn,
  fetchTitleLogo,
} from "./api/tmdb";
import { fetchWatchProviders, fetchRandomTitle } from "./api/tmdb";
import type { WatchProvider } from "./api/tmdb.server";

export type { Movie };

export {
  fetchPopular,
  fetchPopularTv,
};

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

/** Enrich hero slides with exact age ratings and runtimes from TMDB. */
async function enrichHeroSlides(items: Movie[]): Promise<Movie[]> {
  const [withRatings, withRuntimes] = await Promise.all([
    enrichCertificationsFn({ data: { items } }).catch(() => items),
    enrichRuntimesFn({ data: { items } }).catch(() => items),
  ]);
  const runtimeById = new Map<string, Movie>(
    (withRuntimes as Movie[]).map((m) => [m.id, m]),
  );

  // Enrich TV shows with content_ratings (e.g. TV-MA) so ratings display on slideshows.
  const tvItems = (withRatings as Movie[]).filter((m) => m.id.startsWith("tv-") && !m.rating);
  let certById = new Map<string, string>();
  if (tvItems.length > 0) {
    try {
      const { tmdbFetch } = await import("./api/tmdb.server");
      const results = await Promise.allSettled(
        tvItems.map((m) =>
          tmdbFetch(`/tv/${m.id.slice(3)}`, { append_to_response: "content_ratings" }),
        ),
      );
      results.forEach((r, idx) => {
        if (r.status === "fulfilled") {
          const source = r.value.content_ratings?.results ?? [];
          const entry = source.find((x: any) => x.iso_3166_1 === "US") ?? source[0];
          const cert = entry?.rating ?? "";
          if (cert) certById.set(tvItems[idx].id, cert);
        }
      });
    } catch {}
  }

  return (withRatings as Movie[]).map((m) => {
    let enriched = runtimeById.get(m.id);
    if (!enriched) enriched = m;
    if (certById.has(m.id)) {
      enriched = { ...enriched, rating: certById.get(m.id)! };
    }
    // For TV shows, preserve the season-based runtime (e.g. "2 seasons")
    // instead of letting enrichRuntimes overwrite it with episode runtime.
    if (m.id.startsWith("tv-") && m.runtime && m.runtime.includes("season")) {
      enriched = { ...enriched, runtime: m.runtime };
    }
    return enriched;
  });
}

async function loadHome() {
  const [
    trendingAllWeek,
    nowPlaying,
    topRated,
    topRatedTv,
    trendingAllDay,
    airingTv,
    ...genreItems
  ] = await Promise.all([
    fetchTrendingAllWeek(),
    fetchNowPlaying(),
    fetchTopRated(),
    fetchTopRatedTv(),
    fetchTrendingAllDay(),
    fetchAiringTv(),
    ...HOME_GENRES.map((g) => discoverByGenreMixed({ data: { genreId: g.id } })),
  ]);

  let recommendations: Movie[] = [];
  try {
    if (trendingAllWeek.length > 0) {
      recommendations = await fetchRecommendations({ data: { id: trendingAllWeek[0].id } });
    }
  } catch {}

  const top10Today = trendingAllDay.slice(0, 10);
  const top10TrendingWeek = trendingAllWeek.slice(0, 10);

  // Enrich genre groups and rows with runtimes
  const allItems = [
    ...genreItems.flat(),
    ...trendingAllWeek,
    ...(recommendations || []),
    ...topRated,
    ...topRatedTv,
    ...nowPlaying,
    ...airingTv,
  ];
  const enrichedHome = await enrichRuntimesFn({ data: { items: allItems } });
  const enrichedMap = new Map((enrichedHome as Movie[]).map((m) => [m.id, m]));
  const enrich = (items: Movie[]) => items.map((m) => enrichedMap.get(m.id) ?? m);

  const genreGroups = HOME_GENRES.map((g, i) => ({ id: g.id, name: g.name, items: enrich(genreItems[i]) }));

  return {
    // Fetch each hero slide's logo from TMDB using the same per-title technology
    // as the movie info page (fetchTitleLogo), so the slideshow displays TMDB
    // logos via wsrv.nl instead of plain titles.
    heroSlides: await (async () => {
      const top5 = trendingAllWeek.slice(0, 5);
      const enriched = await enrichHeroSlides(top5);
      return Promise.all(
        enriched.map(async (s) => {
          const logo = await fetchTitleLogo({ data: { id: s.id } }).catch(() => null);
          return {
            ...s,
            logo: logo?.filePath ? { filePath: logo.filePath } : undefined,
          };
        }),
      );
    })(),
    top10Today,
    top10TrendingWeek,
    genreGroups,
    rows: [
      ...(recommendations.length ? [{ title: "Recommended for You", items: enrich(recommendations) }] : []),
      { title: "Top Rated", items: enrich([...topRated, ...topRatedTv].slice(0, 10)) },
      { title: "New Releases", items: enrich([...nowPlaying, ...airingTv].slice(0, 12)) },
    ],
  };
}

export async function loadMovies() {
  // Fetch trending today and this week
  const [trendingDayResult, trendingWeekResult] = await Promise.all([
    fetchTrendingDay(),
    fetchTrending(),
  ]);

  const [
    popular,
    topRated,
    nowPlaying,
    upcoming,
    recommended,
  ] = await Promise.all([
    fetchPopular(),
    fetchTopRated(),
    fetchNowPlaying(),
    fetchUpcoming(),
    // Get recommendations based on first trending movie
    trendingWeekResult.length > 0 ? fetchRecommendations({ data: { id: trendingWeekResult[0].id } }).catch(() => []) : Promise.resolve([]),
  ]);
  const enrichedRows = await enrichRuntimesFn({
    data: {
      items: [
        ...trendingDayResult,
        ...trendingWeekResult,
        ...popular,
        ...topRated,
        ...nowPlaying,
        ...upcoming,
        ...recommended,
      ],
    },
  });
  const enrichedMap = new Map((enrichedRows as Movie[]).map((m) => [m.id, m]));
  const enrich = (items: Movie[]) => items.map((m) => enrichedMap.get(m.id) ?? m);
  return {
    heroSlides: await enrichHeroSlides(popular.slice(0, 3)),
    top10Today: [],
    genreGroups: [],
    rows: [
      { title: "Trending Today", items: enrich(trendingDayResult) },
      { title: "Trending This Week", items: enrich(trendingWeekResult.slice(0, 10)) },
      { title: "Popular Movies", items: enrich(popular) },
      { title: "Now Playing", items: enrich(nowPlaying) },
      { title: "Upcoming", items: enrich(upcoming) },
      { title: "Top Rated", items: enrich(topRated) },
      { title: "Recommended for You", items: enrich(recommended) },
    ],
  };
}

export async function loadTv() {
  // Fetch trending TV first to use for recommendations
  const trendingResult = await fetchTrendingTv();

  const [
    trendingDay,
    popular,
    topRated,
    airing,
    upcoming,
    recommended,
  ] = await Promise.all([
    fetchTrendingTvDay(),
    fetchPopularTv(),
    fetchTopRatedTv(),
    fetchAiringTv(),
    fetchUpcomingTv(),
    // Get recommendations based on first trending TV show
    trendingResult.length > 0 ? fetchRecommendations({ data: { id: trendingResult[0].id } }).catch(() => []) : Promise.resolve([]),
  ]);
  const enrichedRows = await enrichRuntimesFn({
    data: {
      items: [
        ...trendingResult,
        ...trendingDay,
        ...popular,
        ...topRated,
        ...airing,
        ...upcoming,
        ...recommended,
      ],
    },
  });
  const enrichedMap = new Map((enrichedRows as Movie[]).map((m) => [m.id, m]));
  const enrich = (items: Movie[]) => items.map((m) => enrichedMap.get(m.id) ?? m);
  return {
    heroSlides: await enrichHeroSlides(trendingResult.slice(0, 3)),
    top10Today: [],
    genreGroups: [],
    rows: [
      { title: "Trending Today", items: enrich(trendingDay) },
      { title: "Trending This Week", items: enrich(trendingResult.slice(0, 10)) },
      { title: "Popular Shows", items: enrich(popular) },
      { title: "On the Air Now", items: enrich(airing) },
      { title: "Airing Today", items: enrich(trendingDay.slice(0, 10)) },
      { title: "Upcoming", items: enrich(upcoming) },
      { title: "Top Rated Series", items: enrich(topRated) },
      { title: "Recommended for You", items: enrich(recommended) },
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

  const allNewItems = [
    ...featured,
    ...comingSoon,
    ...trending,
    ...airing,
    ...nowPlaying,
    ...newMovies,
    ...popularTv,
  ];
  const enrichedNew = await enrichRuntimesFn({ data: { items: allNewItems } });
  const enrichedNewMap = new Map((enrichedNew as Movie[]).map((m) => [m.id, m]));
  const enrichNew = (items: Movie[]) => items.map((m) => enrichedNewMap.get(m.id) ?? m);

  return {
    heroSlides: await enrichHeroSlides(featured.slice(0, 3)),
    top10Today: [],
    genreGroups: [],
    rows: [
      {
        title: "New Movies",
        items: enrichNew(
          featured.length
            ? featured
            : newMovies.length
              ? newMovies
              : nowPlaying,
        ),
      },
      { title: "Coming Soon", items: enrichNew(comingSoon) },
      { title: "Most Anticipated Movies", items: enrichNew(popularUpcoming) },
      { title: "New TV Episodes", items: enrichNew(airing) },
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
    const items = await searchMovies({ data: { query } });
    if (items.length === 0) return [];
    const enriched = await enrichRuntimesFn({ data: { items } });
    return enriched as Movie[];
  } catch {
    return [];
  }
}

export async function searchWithFilters(filters: SearchFilterInput): Promise<Movie[]> {
  try {
    const items = await searchFilteredFn({ data: filters });
    if (items.length === 0) return [];
    const enriched = await enrichRuntimesFn({ data: { items } });
    return enriched as Movie[];
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
    const items = await discoverByGenreMixed({ data: { genreId } });
    if (items.length === 0) return [];
    const enriched = await enrichRuntimesFn({ data: { items } });
    return enriched as Movie[];
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

export async function getWatchProviders(id: string, type: "movie" | "tv" = "movie") {
  try {
    return await fetchWatchProviders({ data: { id, type } });
  } catch {
    return {};
  }
}

export async function getRandomTitle() {
  try {
    return await fetchRandomTitle();
  } catch {
    return null;
  }
}

export type { WatchProvider };









