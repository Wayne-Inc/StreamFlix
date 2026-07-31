import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Search as SearchIcon, X, User, Film, ChevronLeft, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/streamflix/Navbar";
import { Footer } from "@/components/streamflix/Footer";
import { MovieCard } from "@/components/streamflix/MovieCard";
import { search, searchByGenre, searchByPerson, getGenres } from "@/lib/streamflix-data";
import type { Movie } from "@/lib/types";
import { isKidsProfile, filterKidsContent, filterKidsGenres } from "@/lib/kids-mode";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional().catch(""),
  tab: z.enum(["titles", "genres", "people"]).optional().catch("titles"),
});

export const Route = createFileRoute("/_authenticated/search")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Search — StreamFlix" }] }),
  component: SearchPage,
});

type Tab = "titles" | "genres" | "people";
type PersonResult = { id: string; name: string; known_for: string; photo: string };

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function SearchPage() {
  const { q: urlQ, tab: urlTab } = useSearch({ from: "/_authenticated/search" });
  const [q, setQ] = useState(urlQ ?? "");
  const [tab, setTab] = useState<Tab>(urlTab ?? "titles");
  const [results, setResults] = useState<Movie[]>([]);
  const [people, setPeople] = useState<PersonResult[]>([]);
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [genreResults, setGenreResults] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const debouncedQ = useDebounce(q, 300);
  const navigate = useNavigate();

  useEffect(() => {
    if (tab !== "titles" || debouncedQ.length < 2) {
      setResults([]);
      setPage(1);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setPage(1);
    search(debouncedQ)
      .then((res) => {
        if (!cancelled) {
          setResults(isKidsProfile() ? filterKidsContent(res) : res);
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
  }, [debouncedQ, tab]);

  useEffect(() => {
    if (tab !== "people" || debouncedQ.length < 2) {
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
    getGenres().then((list) => setGenres(isKidsProfile() ? filterKidsGenres(list) : list));
  }, []);

  const handleGenreClick = async (genreId: number) => {
    setTab("genres");
    setQ("");
    setPage(1);
    setLoading(true);
    try {
      const res = await searchByGenre(String(genreId));
      setGenreResults(isKidsProfile() ? filterKidsContent(res) : res);
    } catch {
      setGenreResults([]);
    }
    setLoading(false);
  };

  // Handle genre pre-selection from URL when genres load
  const genreTriggered = useRef(false);
  useEffect(() => {
    if (tab === "genres" && q && genres.length && !genreTriggered.current) {
      genreTriggered.current = true;
      const match = genres.find((g) => g.name.toLowerCase() === q.toLowerCase());
      if (match) handleGenreClick(match.id);
      else setQ("");
    }
  }, [tab, q, genres]);

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
                  setGenreResults([]);
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
              <div className="flex flex-wrap gap-2">
                {genres.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleGenreClick(g.id)}
                    className="rounded-full border border-border px-4 py-2.5 sm:py-2 text-sm hover:border-primary hover:text-foreground transition"
                  >
                    {g.name}
                  </button>
                ))}
              </div>
              {genreResults.length > 0 && (
                <div className="mt-10">
                  <p className="text-sm text-muted-foreground">{genreResults.length} results</p>
                  <div className="mt-4 flex flex-wrap gap-3 justify-center">
                    {genreResults.slice((page - 1) * 15, page * 15).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => navigate({ to: "/movie/$id", params: { id: m.id } })}
                        className="text-left"
                      >
                        <MovieCard movie={m} />
                      </button>
                    ))}
                  </div>
                  {genreResults.length > 15 && (
                    <div className="mt-8 hidden items-center justify-center gap-2 md:flex">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-default"
                      >
                        <ChevronLeft className="size-4" /> Previous
                      </button>
                      {Array.from(
                        { length: Math.ceil(genreResults.length / 15) },
                        (_, i) => i + 1,
                      ).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`rounded-md px-3 py-2 text-sm ${p === page ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() =>
                          setPage((p) => Math.min(Math.ceil(genreResults.length / 15), p + 1))
                        }
                        disabled={page === Math.ceil(genreResults.length / 15)}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-default"
                      >
                        Next <ChevronRight className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === "titles" && !q && (
            <div className="mt-6">
              <p className="text-sm text-muted-foreground">Trending searches</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Action", "Sci-Fi", "Thriller", "Comedy"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setQ(t)}
                    className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-foreground"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === "titles" && q && (
            <div className="mx-auto mt-10 w-full">
              <p className="text-sm text-muted-foreground">
                {loading
                  ? "Searching..."
                  : `${results.length} result${results.length === 1 ? "" : "s"} for "${q}"`}
              </p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                {results.slice((page - 1) * 15, page * 15).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => navigate({ to: "/movie/$id", params: { id: m.id } })}
                    className="text-left"
                  >
                    <MovieCard movie={m} />
                  </button>
                ))}
              </div>
              {results.length > 15 && (
                <div className="mt-8 hidden items-center justify-center gap-2 md:flex">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-default"
                  >
                    <ChevronLeft className="size-4" /> Previous
                  </button>
                  {Array.from({ length: Math.ceil(results.length / 15) }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`rounded-md px-3 py-2 text-sm ${p === page ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                  <button
                    onClick={() => setPage((p) => Math.min(Math.ceil(results.length / 15), p + 1))}
                    disabled={page === Math.ceil(results.length / 15)}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-default"
                  >
                    Next <ChevronRight className="size-4" />
                  </button>
                </div>
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
                        <img
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
