import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Search as SearchIcon,
  X,
  User,
  Film,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { Navbar } from "@/components/streamflix/Navbar";
import { Footer } from "@/components/streamflix/Footer";
import { MovieCard } from "@/components/streamflix/MovieCard";
import { LazyImage } from "@/components/streamflix/LazyImage";
import {
  MovieCardSkeleton,
  PersonCardSkeleton,
  SkeletonText,
  SkeletonButton,
} from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { search, searchByPerson, searchWithFilters, fetchPopular, fetchPopularTv, type SearchSort } from "@/lib/streamflix-data";
import { fetchPopularPeople, fetchTrendingPeopleDay, fetchTrendingPeopleWeek } from "@/lib/api/tmdb";
import type { Movie } from "@/lib/types";
import { isKidsProfile, filterKidsContent } from "@/lib/kids-mode";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const searchSchema = z.object({
  q: z.string().optional().catch(""),
  tab: z.enum(["titles", "people"]).optional().catch("titles"),
  year: z.coerce.number().optional().catch(undefined),
  genre: z.coerce.number().optional().catch(undefined),
  rating: z.coerce.number().optional().catch(undefined),
  sort: z.enum(["relevance", "popularity", "rating", "year", "title"]).optional().catch(undefined),
});

export const Route = createFileRoute("/_authenticated/search")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Search — StreamFlix" }] }),
  component: SearchPage,
});

type Tab = "titles" | "people";
type PersonResult = { id: string; name: string; known_for: string; photo: string };

const SORT_LABELS: Record<SearchSort, string> = {
  relevance: "Relevance",
  popularity: "Most popular",
  rating: "Top rated",
  year: "Newest",
  title: "A–Z",
};

const CURATED_GENRES: { id: number; name: string }[] = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 27, name: "Horror" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" },
];

const filterSelectClass =
  "h-9 w-auto min-w-[8rem] border-border bg-surface text-sm text-foreground data-[placeholder]:text-muted-foreground";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function SearchPage() {
  const currentSearch = useSearch({ from: "/_authenticated/search" });
  const {
    q: urlQ,
    tab: urlTab,
    year: urlYear,
    genre: urlGenre,
    rating: urlRating,
    sort: urlSort,
  } = currentSearch;
  const [q, setQ] = useState(urlQ ?? "");
  const [tab, setTab] = useState<Tab>(urlTab ?? "titles");
  const [year, setYear] = useState<number | undefined>(urlYear);
  const [genre, setGenre] = useState<number | undefined>(urlGenre);
  const [rating, setRating] = useState<number | undefined>(urlRating);
  const [sort, setSort] = useState<SearchSort | undefined>(urlSort);
  const [page, setPage] = useState(1);
  const debouncedQ = useDebounce(q, 300);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const kidsMode = isKidsProfile();
  const hasFilters = Boolean(year || genre || rating || sort);
  const canSearch = debouncedQ.length >= 2 || hasFilters;

  // Invalidate search cache when URL search params change (e.g., back navigation)
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["search"] });
  }, [currentSearch, queryClient]);

  // Build cache key based on search parameters
  const searchKey = ["search", "titles", debouncedQ, year, genre, rating, sort, kidsMode] as const;
  const peopleKey = ["search", "people", debouncedQ] as const;

  // Fetch titles with React Query caching
  const titlesQuery = useQuery({
    queryKey: searchKey,
    queryFn: async () => {
      const run = hasFilters
        ? searchWithFilters({
            query: debouncedQ.length >= 2 ? debouncedQ : "",
            genreId: genre,
            year,
            minRating: rating,
            sort,
          })
        : search(debouncedQ);
      const res = await run;
      return kidsMode ? filterKidsContent(res) : res;
    },
    enabled: tab === "titles" && canSearch,
    staleTime: 0, // Always refetch when params change
    gcTime: 10 * 60 * 1000,
  });

  // Fetch people with React Query caching
  const peopleQuery = useQuery({
    queryKey: peopleKey,
    queryFn: () => searchByPerson(debouncedQ),
    enabled: tab === "people" && debouncedQ.length >= 2,
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch popular people (for empty query on people tab)
  const popularPeopleQuery = useQuery({
    queryKey: ["search", "people", "popular"],
    queryFn: () => fetchPopularPeople({ data: { page: 1 } }),
    enabled: tab === "people" && debouncedQ.length < 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch trending people of the day
  const trendingPeopleDayQuery = useQuery({
    queryKey: ["search", "people", "trending", "day"],
    queryFn: () => fetchTrendingPeopleDay({ data: { page: 1 } }),
    enabled: tab === "people" && debouncedQ.length < 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch trending people of the week
  const trendingPeopleWeekQuery = useQuery({
    queryKey: ["search", "people", "trending", "week"],
    queryFn: () => fetchTrendingPeopleWeek({ data: { page: 1 } }),
    enabled: tab === "people" && debouncedQ.length < 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch popular movies (for empty query on titles tab)
  const popularMoviesQuery = useQuery({
    queryKey: ["search", "titles", "popular", "movies"],
    queryFn: () => fetchPopular({ data: { page: 1 } }),
    enabled: tab === "titles" && debouncedQ.length < 2 && !hasFilters,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch popular TV shows (for empty query on titles tab)
  const popularTvQuery = useQuery({
    queryKey: ["search", "titles", "popular", "tv"],
    queryFn: () => fetchPopularTv({ data: { page: 1 } }),
    enabled: tab === "titles" && debouncedQ.length < 2 && !hasFilters,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Sync query data to local state for pagination
  const results = titlesQuery.data ?? [];
  const people = peopleQuery.data ?? [];
  const loading = titlesQuery.isLoading || peopleQuery.isLoading;

  const years = Array.from(
    { length: new Date().getFullYear() - 1970 + 1 },
    (_, i) => new Date().getFullYear() - i,
  );

  const curatedGenres = CURATED_GENRES;

  const pushFilters = (next: {
    year?: number;
    genre?: number;
    rating?: number;
    sort?: SearchSort;
  }) => {
    navigate({
      to: "/search",
      search: { ...currentSearch, ...next },
      replace: true,
    });
  };

  const clearFilters = () => {
    setYear(undefined);
    setGenre(undefined);
    setRating(undefined);
    setSort(undefined);
    pushFilters({ year: undefined, genre: undefined, rating: undefined, sort: undefined });
  };

  // Reset page when query changes
  useEffect(() => {
    setPage(1);
  }, [debouncedQ, tab, year, genre, rating, sort, kidsMode]);

  // Prefetch next page for smoother pagination
  useEffect(() => {
    if (tab === "titles" && page < Math.max(1, Math.ceil(results.length / 24))) {
      // No-op: results are already fully loaded, pagination is client-side
    }
  }, [tab, page, results.length]);

  const totalPages = Math.max(1, Math.ceil(results.length / 24));
  const visible = results.slice((page - 1) * 24, page * 24);

  const popularPeople = popularPeopleQuery.data?.results ?? [];
  const trendingPeopleDay = trendingPeopleDayQuery.data?.results ?? [];
  const trendingPeopleWeek = trendingPeopleWeekQuery.data?.results ?? [];

  const peopleLoading = popularPeopleQuery.isLoading || trendingPeopleDayQuery.isLoading || trendingPeopleWeekQuery.isLoading;

  const mapPerson = (p: any) => ({
    id: String(p.id),
    name: p.name,
    photo: p.profile_path ? `https://image.tmdb.org/t/p/w342${p.profile_path}` : "",
    known_for: p.known_for_department,
  });

  const popularPeopleMapped = popularPeople.map(mapPerson).slice(0, 10);
  const trendingPeopleDayMapped = trendingPeopleDay.map(mapPerson).slice(0, 10);
  const trendingPeopleWeekMapped = trendingPeopleWeek.map(mapPerson).slice(0, 10);

  // Map popular movies and TV shows
  const popularMovies = popularMoviesQuery.data ?? [];
  const popularTvShows = popularTvQuery.data ?? [];
  const popularMoviesMapped = popularMovies.slice(0, 10);
  const popularTvShowsMapped = popularTvShows.slice(0, 10);
  const popularLoading = popularMoviesQuery.isLoading || popularTvQuery.isLoading;

  const PersonCard = ({ person, fluid = false }: { person: PersonResult; fluid?: boolean }) => (
    <Link
      to="/person/$id"
      params={{ id: person.id }}
      className={`flex flex-col gap-2 group flex-shrink-0 ${fluid ? "w-full" : "w-[160px] sm:w-[180px] md:w-[200px]"}`}
    >
      {person.photo ? (
        <LazyImage
          src={person.photo}
          alt={person.name}
          className="aspect-[2/3] w-full rounded-lg object-cover ring-2 ring-transparent group-hover:ring-primary/50 transition"
        />
      ) : (
        <div className="aspect-[2/3] w-full rounded-lg bg-muted flex items-center justify-center">
          <User className="size-12 text-muted-foreground" />
        </div>
      )}
      <span className="text-sm font-medium text-center truncate text-foreground">{person.name}</span>
    </Link>
  );

  const PeopleSection = ({ title, people, loading }: { title: string; people: PersonResult[]; loading: boolean }) => (
    <div className="space-y-4 py-4">
      <h2 className="px-4 sm:px-8 mb-4 sm:mb-6 text-3xl sm:text-4xl font-bold tracking-tight">{title}</h2>
      {loading ? (
        <div className="relative scrollbar-hide flex gap-4 sm:gap-6 overflow-x-auto px-4 sm:px-8">
          <button
            type="button"
            aria-label="Scroll back"
            className="absolute left-1 sm:left-2 top-1/2 z-30 hidden size-10 -translate-y-1/2 place-items-center rounded-md border border-border bg-background/90 text-foreground shadow-lg backdrop-blur transition hover:bg-primary hover:text-primary-foreground sm:grid"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Scroll forward"
            className="absolute right-1 sm:right-2 top-1/2 z-30 hidden size-10 -translate-y-1/2 place-items-center rounded-md border border-border bg-background/90 text-foreground shadow-lg backdrop-blur transition hover:bg-primary hover:text-primary-foreground sm:grid"
          >
            <ChevronRight className="size-5" />
          </button>
          {[1, 2, 3, 4, 5].map((i) => (
            <PersonCardSkeleton key={i} />
          ))}
        </div>
      ) : people.length > 0 ? (
        <div className="scrollbar-hide flex gap-4 sm:gap-6 overflow-x-auto px-4 sm:px-8 pb-4">
          {people.map((p) => (
            <PersonCard key={p.id} person={p} />
          ))}
        </div>
      ) : (
        <p className="px-4 sm:px-8 text-sm text-muted-foreground">No people found</p>
      )}
    </div>
  );

  const TitleSection = ({ title, movies, loading }: { title: string; movies: Movie[]; loading: boolean }) => (
    <div className="space-y-4 py-4">
      <h2 className="px-4 sm:px-8 mb-4 sm:mb-6 text-3xl sm:text-4xl font-bold tracking-tight">{title}</h2>
      {loading ? (
        <div className="relative scrollbar-hide flex gap-4 sm:gap-6 overflow-x-auto px-4 sm:px-8">
          <button
            type="button"
            aria-label="Scroll back"
            className="absolute left-1 sm:left-2 top-1/2 z-30 hidden size-10 -translate-y-1/2 place-items-center rounded-md border border-border bg-background/90 text-foreground shadow-lg backdrop-blur transition hover:bg-primary hover:text-primary-foreground sm:grid"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Scroll forward"
            className="absolute right-1 sm:right-2 top-1/2 z-30 hidden size-10 -translate-y-1/2 place-items-center rounded-md border border-border bg-background/90 text-foreground shadow-lg backdrop-blur transition hover:bg-primary hover:text-primary-foreground sm:grid"
          >
            <ChevronRight className="size-5" />
          </button>
          {Array.from({ length: 5 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      ) : movies.length > 0 ? (
        <div className="scrollbar-hide flex gap-4 sm:gap-6 overflow-x-auto px-4 sm:px-8">
          {movies.map((m) => (
            <button
              key={m.id}
              onClick={() => navigate({ to: "/movie/$id", params: { id: m.id } })}
              className="shrink-0 text-left"
            >
              <MovieCard movie={m} />
            </button>
          ))}
        </div>
      ) : (
        <p className="px-4 sm:px-8 text-sm text-muted-foreground">No titles found</p>
      )}
    </div>
  );

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <main className="px-4 pt-24 pb-16 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search titles or people…"
              aria-label="Search titles or people"
              className="w-full rounded-full border border-border bg-surface pl-12 pr-12 py-3.5 sm:py-4 text-base sm:text-lg focus:border-primary focus:outline-none"
            />
            {q && (
              <button
                onClick={() => {
                  setQ("");
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                aria-label="Clear"
              >
                <X className="size-5" />
              </button>
            )}
          </div>

          <div className="mt-4 flex gap-2 border-b border-border overflow-x-auto">
            {(["titles", "people"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setPage(1);
                  queryClient.invalidateQueries({ queryKey: ["search"] });
                }}
                className={`flex items-center gap-1.5 px-4 py-2.5 sm:py-2 text-sm font-medium transition-all duration-300 ease-in-out border-b-2 -mb-px ${tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {t === "titles" && <Film className="size-4" />}
                {t === "people" && <User className="size-4" />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <section className="mx-auto w-full max-w-[1800px]">
          {tab === "titles" && !q && !hasFilters && (
            <>
              <TitleSection
                title="Popular Movies"
                movies={popularMoviesMapped}
                loading={popularLoading}
              />
              <TitleSection
                title="Popular TV Shows"
                movies={popularTvShowsMapped}
                loading={popularLoading}
              />
            </>
          )}

          {tab === "titles" && (q || hasFilters || loading) && (
            <div className="mx-auto mt-6 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <SlidersHorizontal className="size-4" /> Filters
                </span>
                <Select
                  value={year ? String(year) : "all"}
                  onValueChange={(v) => {
                    const val = v === "all" ? undefined : Number(v);
                    setYear(val);
                    pushFilters({ year: val });
                  }}
                >
                  <SelectTrigger aria-label="Year" className={filterSelectClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any year</SelectItem>
                    {years.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={genre ? String(genre) : "all"}
                  onValueChange={(v) => {
                    const val = v === "all" ? undefined : Number(v);
                    setGenre(val);
                    pushFilters({ genre: val });
                  }}
                >
                  <SelectTrigger aria-label="Category" className={filterSelectClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {curatedGenres.map((g) => (
                      <SelectItem key={g.id} value={String(g.id)}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={rating ? String(rating) : "all"}
                  onValueChange={(v) => {
                    const val = v === "all" ? undefined : Number(v);
                    setRating(val);
                    pushFilters({ rating: val });
                  }}
                >
                  <SelectTrigger aria-label="Minimum rating" className={filterSelectClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any rating</SelectItem>
                    <SelectItem value="7">7+</SelectItem>
                    <SelectItem value="8">8+</SelectItem>
                    <SelectItem value="9">9+</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={sort ?? "relevance"}
                  onValueChange={(v) => {
                    const val = v === "relevance" ? undefined : (v as SearchSort);
                    setSort(val);
                    pushFilters({ sort: val });
                  }}
                >
                  <SelectTrigger aria-label="Sort" className={filterSelectClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Sort: Relevance</SelectItem>
                    {(["popularity", "rating", "year", "title"] as SearchSort[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {SORT_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 hover:border-destructive hover:text-destructive"
                  >
                    Clear
                  </button>
                )}
              </div>

              <p className="mt-6 text-sm text-muted-foreground">
                {loading
                  ? "Searching..."
                  : q
                    ? `${results.length} result${results.length === 1 ? "" : "s"} for "${q}"`
                    : `${results.length} title${results.length === 1 ? "" : "s"} matching your filters`}
              </p>
              {loading && (
                <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <MovieCardSkeleton key={i} fluid />
                  ))}
                </div>
              )}
              {!loading && results.length === 0 && (
                <p className="mt-10 text-center text-sm text-muted-foreground">
                  No titles found. Try adjusting your filters.
                </p>
              )}
              {!loading && results.length > 0 && (
                <>
                  <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                    {visible.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => navigate({ to: "/movie/$id", params: { id: m.id } })}
                        className="overflow-hidden w-full text-left"
                      >
                        <MovieCard movie={m} fluid />
                      </button>
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="mt-8 hidden items-center justify-center gap-2 md:flex">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 hover:text-foreground disabled:opacity-40 disabled:cursor-default"
                      >
                        <ChevronLeft className="size-4" /> Previous
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`rounded-md px-3 py-2 text-sm transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${p === page ? "bg-primary text-primary-foreground scale-105" : "border border-border text-muted-foreground hover:text-foreground"}`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 hover:text-foreground disabled:opacity-40 disabled:cursor-default"
                      >
                        Next <ChevronRight className="size-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {tab === "people" && (
            <div className="mt-6">
              {!q ? (
                <>
                  <PeopleSection
                    title="Popular People"
                    people={popularPeopleMapped}
                    loading={popularPeopleQuery.isLoading}
                  />
                  <PeopleSection
                    title="Trending Today"
                    people={trendingPeopleDayMapped}
                    loading={trendingPeopleDayQuery.isLoading}
                  />
                  <PeopleSection
                    title="Trending This Week"
                    people={trendingPeopleWeekMapped}
                    loading={trendingPeopleWeekQuery.isLoading}
                  />
                </>
              ) : (
                <div className="space-y-3">
                  {peopleQuery.isLoading ? (
                    <div className="relative scrollbar-hide flex gap-4 sm:gap-6 overflow-x-auto px-4 sm:px-8 pb-4">
                      <button
                        type="button"
                        aria-label="Scroll back"
                        className="absolute left-1 sm:left-2 top-1/2 z-30 hidden size-10 -translate-y-1/2 place-items-center rounded-md border border-border bg-background/90 text-foreground shadow-lg backdrop-blur transition hover:bg-primary hover:text-primary-foreground sm:grid"
                      >
                        <ChevronLeft className="size-5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Scroll forward"
                        className="absolute right-1 sm:right-2 top-1/2 z-30 hidden size-10 -translate-y-1/2 place-items-center rounded-md border border-border bg-background/90 text-foreground shadow-lg backdrop-blur transition hover:bg-primary hover:text-primary-foreground sm:grid"
                      >
                        <ChevronRight className="size-5" />
                      </button>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <PersonCardSkeleton key={i} fluid />
                      ))}
                    </div>
                  ) : people.length === 0 ? (
                    <p className="px-4 sm:px-8 text-sm text-muted-foreground">No people found</p>
                  ) : (
                    <div className="scrollbar-hide flex gap-4 sm:gap-6 overflow-x-auto px-4 sm:px-8 pb-4">
                      {people.map((p: PersonResult) => (
                        <PersonCard key={p.id} person={p} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
