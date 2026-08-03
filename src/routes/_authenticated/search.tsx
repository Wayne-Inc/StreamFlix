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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  search,
  searchByPerson,
  searchWithFilters,
  type SearchSort,
} from "@/lib/streamflix-data";
import type { Movie } from "@/lib/types";
import { isKidsProfile, filterKidsContent, filterKidsGenres } from "@/lib/kids-mode";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional().catch(""),
  tab: z.enum(["titles", "people"]).optional().catch("titles"),
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
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const debouncedQ = useDebounce(q, 300);
  const navigate = useNavigate();

  const kidsMode = isKidsProfile();
  const hasFilters = Boolean(year || genre || rating || sort);
  const canSearch = debouncedQ.length >= 2 || hasFilters;

  const years = Array.from(
    { length: new Date().getFullYear() - 1970 + 1 },
    (_, i) => new Date().getFullYear() - i,
  );

  const curatedGenres = kidsMode ? filterKidsGenres(CURATED_GENRES) : CURATED_GENRES;

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
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search titles or people\u2026"
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
                  setQ("");
                  setResults([]);
                  setPeople([]);
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 px-4 py-2.5 sm:py-2 text-sm font-medium transition border-b-2 -mb-px ${tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
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
            <div className="mt-6">
              <p className="text-sm text-muted-foreground">Trending searches</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {trending.map((t) => {
                  const match = curatedGenres.find((g) => g.name.toLowerCase() === t.toLowerCase());
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
