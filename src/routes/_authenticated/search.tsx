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
import { Skeleton } from "@/components/ui/skeleton";
import {
  search,
  searchByPerson,
  getGenres,
  searchWithFilters,
  suggestTitles,
  type SearchSort,
} from "@/lib/streamflix-data";
import type { Movie } from "@/lib/types";
import {
  isKidsProfile,
  filterKidsContent,
  filterKidsGenres,
  isBlockedKidsGenre,
} from "@/lib/kids-mode";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional().catch(""),
  tab: z.enum(["titles", "genres", "people"]).optional().catch("titles"),
  year: z.coerce.number().optional().catch(undefined),
  genre: z.coerce.number().optional().catch(undefined),
  rating: z.coerce.number().optional().catch(undefined),
  sort: z
    .enum(["relevance", "popularity", "rating", "year", "title"])
    .optional()
    .catch(undefined),
});

export const Route = createFileRoute("/_authenticated/search")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Search — StreamFlix" }] }),
  component: SearchPage,
});

type Tab = "titles" | "genres" | "people";
type PersonResult = { id: string; name: string; known_for: string; photo: string };
type SuggestItem = {
  id: string;
  title: string;
  year: number | null;
  poster: string;
  mediaType: "movie" | "tv";
  genreIds: number[];
};

const SORT_LABELS: Record<SearchSort, string> = {
  relevance: "Relevance",
  popularity: "Most popular",
  rating: "Top rated",
  year: "Newest",
  title: "A–Z",
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const selectClass =
  "rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary";

function SearchPage() {
  const currentSearch = useSearch({ from: "/_authenticated/search" });
  const { q: urlQ, tab: urlTab, year: urlYear, genre: urlGenre, rating: urlRating, sort: urlSort } =
    currentSearch;
  const [q, setQ] = useState(urlQ ?? "");
  const [tab, setTab] = useState<Tab>(urlTab ?? "titles");
  const [year, setYear] = useState<number | undefined>(urlYear);
  const [genre, setGenre] = useState<number | undefined>(urlGenre);
  const [rating, setRating] = useState<number | undefined>(urlRating);
  const [sort, setSort] = useState<SearchSort | undefined>(urlSort);
  const [results, setResults] = useState<Movie[]>([]);
  const [people, setPeople] = useState<PersonResult[]>([]);
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestItem[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const debouncedQ = useDebounce(q, 300);
  const navigate = useNavigate();

  const kidsMode = isKidsProfile();
  const hasFilters = Boolean(year || genre || rating || sort);
  const canSearch = debouncedQ.length >= 2 || hasFilters;

  const years = Array.from(
    { length: new Date().getFullYear() - 1970 + 1 },
    (_, i) => new Date().getFullYear() - i,
  );

  const safeGenres = kidsMode ? filterKidsGenres(genres) : genres;

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

  useEffect(() => {
    if (tab !== "titles" || !canSearch) {
      setResults([]);
      setPage(1);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setPage(1);
    const run = hasFilters
      ? searchWithFilters({
          query: debouncedQ.length >= 2 ? debouncedQ : "",
          genreId: genre,
          year,
          minRating: rating,
          sort,
        })
      : search(debouncedQ);
    run
      .then((res) => {
        if (!cancelled) {
          setResults(kidsMode ? filterKidsContent(res) : res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResults([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, tab, year, genre, rating, sort, canSearch, hasFilters, kidsMode]);

  useEffect(() => {
    if (tab === "people" || debouncedQ.length < 2) {
      setPeople([]);
      return;
    }
    let cancelled = false;
    searchByPerson(debouncedQ)
      .then((res) => {
        if (!cancelled) setPeople(res);
      })
      .catch(() => {
        if (!cancelled) setPeople([]);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, tab]);

  useEffect(() => {
    if (tab !== "titles" || debouncedQ.length < 2) {
      setSuggestions([]);
      setSuggestOpen(false);
      return;
    }
    let cancelled = false;
    suggestTitles(debouncedQ)
      .then((res: SuggestItem[]) => {
        if (cancelled) return;
        const list = kidsMode
          ? res.filter((s) => !s.genreIds.some(isBlockedKidsGenre))
          : res;
        setSuggestions(list);
        setSuggestOpen(list.length > 0);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, tab, kidsMode]);

  useEffect(() => {
    getGenres().then((list) => setGenres(kidsMode ? filterKidsGenres(list) : list));
  }, [kidsMode]);

  const trending = ["Action", "Sci-Fi", "Thriller", "Comedy"];

  const totalPages = Math.max(1, Math.ceil(results.length / 24));
  const visible = results.slice((page - 1) * 24, page * 24);

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <main className="px-4 pt-24 pb-16 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={tab === "genres" ? "" : q}
              onChange={(e) => {
                setQ(e.target.value);
                setSuggestOpen(true);
              }}
              onFocus={() => {
                if (suggestions.length > 0) setSuggestOpen(true);
              }}
              onBlur={() => {
                setTimeout(() => setSuggestOpen(false), 150);
              }}
              placeholder={
                tab === "genres" ? "Click a genre below" : "Titles, genres, people\u2026"
              }
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
            {suggestOpen && suggestions.length > 0 && (
              <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
                <p className="px-3 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Suggestions
                </p>
                {suggestions.map((s) => (
                  <Link
                    key={s.id}
                    to="/movie/$id"
                    params={{ id: s.id }}
                    onMouseDown={(e) => e.preventDefault()}
                    className="flex items-center gap-3 px-3 py-2 transition hover:bg-accent"
                  >
                    {s.poster ? (
                      <img
                        src={s.poster}
                        alt=""
                        className="size-10 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="grid size-10 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                        <Film className="size-4" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{s.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.year ?? "—"}
                        {s.mediaType === "tv" ? " · Series" : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2 border-b border-border overflow-x-auto">
            {(["titles", "genres", "people"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setQ("");
                  setResults([]);
                  setPeople([]);
                  setSuggestions([]);
                  setSuggestOpen(false);
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 px-4 py-2.5 sm:py-2 text-sm font-medium transition border-b-2 -mb-px ${tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {t === "titles" && <Film className="size-4" />}
                {t === "genres" && <SearchIcon className="size-4" />}
                {t === "people" && <User className="size-4" />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <section className="mx-auto w-full max-w-[1800px]">
          {tab === "genres" && (
            <div className="mt-6">
              <p className="text-sm text-muted-foreground">
                {genres.length} genres — tap one to open its page
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {genres.map((g) => (
                  <Link
                    key={g.id}
                    to="/explore/$genreId"
                    params={{ genreId: String(g.id) }}
                    search={{ q: g.name }}
                    className="rounded-full border border-border px-4 py-2.5 sm:py-2 text-sm hover:border-primary hover:text-foreground transition"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {tab === "titles" && !q && !hasFilters && (
            <div className="mt-6">
              <p className="text-sm text-muted-foreground">Trending searches</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {trending.map((t) => {
                  const match = genres.find((g) => g.name.toLowerCase() === t.toLowerCase());
                  return match ? (
                    <Link
                      key={t}
                      to="/explore/$genreId"
                      params={{ genreId: String(match.id) }}
                      search={{ q: match.name }}
                      className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-foreground"
                    >
                      {t}
                    </Link>
                  ) : (
                    <button
                      key={t}
                      onClick={() => setQ(t)}
                      className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-foreground"
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "titles" && (q || hasFilters || loading) && (
            <div className="mx-auto mt-6 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <SlidersHorizontal className="size-4" /> Filters
                </span>
                <select
                  value={year ?? ""}
                  onChange={(e) => {
                    const v = e.target.value ? Number(e.target.value) : undefined;
                    setYear(v);
                    pushFilters({ year: v });
                  }}
                  aria-label="Year"
                  className={selectClass}
                >
                  <option value="">Any year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <select
                  value={genre ?? ""}
                  onChange={(e) => {
                    const v = e.target.value ? Number(e.target.value) : undefined;
                    setGenre(v);
                    pushFilters({ genre: v });
                  }}
                  aria-label="Genre"
                  className={selectClass}
                >
                  <option value="">All genres</option>
                  {safeGenres.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <select
                  value={rating ?? ""}
                  onChange={(e) => {
                    const v = e.target.value ? Number(e.target.value) : undefined;
                    setRating(v);
                    pushFilters({ rating: v });
                  }}
                  aria-label="Minimum rating"
                  className={selectClass}
                >
                  <option value="">Any rating</option>
                  <option value={7}>7+</option>
                  <option value={8}>8+</option>
                  <option value={9}>9+</option>
                </select>
                <select
                  value={sort ?? ""}
                  onChange={(e) => {
                    const v = (e.target.value || undefined) as SearchSort | undefined;
                    setSort(v);
                    pushFilters({ sort: v });
                  }}
                  aria-label="Sort"
                  className={selectClass}
                >
                  <option value="">Sort: Relevance</option>
                  {(["popularity", "rating", "year", "title"] as SearchSort[]).map((s) => (
                    <option key={s} value={s}>
                      {SORT_LABELS[s]}
                    </option>
                  ))}
                </select>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition hover:border-destructive hover:text-destructive"
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
                <div className="mt-6 flex flex-wrap gap-3 justify-center">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} className="w-[160px] sm:w-[200px] aspect-[2/3] rounded-md" />
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
                  <div className="mt-6 flex flex-wrap gap-3 justify-center">
                    {visible.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => navigate({ to: "/movie/$id", params: { id: m.id } })}
                        className="text-left"
                      >
                        <MovieCard movie={m} />
                      </button>
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="mt-8 hidden items-center justify-center gap-2 md:flex">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-default"
                      >
                        <ChevronLeft className="size-4" /> Previous
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`rounded-md px-3 py-2 text-sm ${p === page ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-default"
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
                <p className="text-sm text-muted-foreground">
                  Type an actor or director name above
                </p>
              ) : (
                <div className="space-y-3">
                  {people.length === 0 && (
                    <p className="text-sm text-muted-foreground">No people found</p>
                  )}
                  {people.map((p) => (
                    <Link
                      key={p.id}
                      to="/person/$id"
                      params={{ id: p.id }}
                      className="flex items-center gap-4 rounded-lg border border-border bg-surface p-3 hover:ring-1 hover:ring-primary transition"
                    >
                      {p.photo ? (
                        <LazyImage
                          src={p.photo}
                          alt={p.name}
                          className="size-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
                          <User className="size-6" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{p.name}</p>
                        {p.known_for && (
                          <p className="truncate text-xs text-muted-foreground">{p.known_for}</p>
                        )}
                      </div>
                    </Link>
                  ))}
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
