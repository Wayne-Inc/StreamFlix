import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Navbar } from "@/components/streamflix/Navbar";
import { HeroBanner } from "@/components/streamflix/HeroBanner";
import { Row } from "@/components/streamflix/Row";
import { MovieCard } from "@/components/streamflix/MovieCard";
import { Footer } from "@/components/streamflix/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { ReleaseReminderBanner } from "@/components/streamflix/ReleaseReminderBanner";
import { loadBrowseData, searchByGenre, type BrowseKind } from "@/lib/streamflix-data";
import { fetchPopular } from "@/lib/api/tmdb";
import type { Movie } from "@/lib/types";
import { auth } from "@/lib/firebase";
import { getFavoriteGenres, GENRE_OPTIONS } from "@/lib/favorite-genres";
import {
  getContinueWatching,
  getWatchHistory,
  toMovie as continueToMovie,
  type ContinueItem,
} from "@/lib/continue-watching";
import {
  getContinueWatchingFromFirestore,
  toMovie as fsToMovie,
} from "@/lib/continue-watching-firestore";
import { isKidsProfile, filterKidsContent } from "@/lib/kids-mode";
import { getPersonalizedRecommendations, type RecommendSeed } from "@/lib/recommendations";

const searchSchema = z.object({
  kind: z.enum(["home", "movies", "tv", "new"]).catch("home").default("home"),
});

function BrowseSkeleton() {
  const kind =
    (typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("kind")
      : "home") || "home";
  const isHome = kind === "home";
  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <div className="relative min-h-[45vh] h-[55vh] w-full overflow-hidden bg-surface/60 sm:min-h-[420px] sm:h-[75vh] lg:min-h-[560px] lg:h-[88vh]">
        <Skeleton className="absolute inset-0 h-full w-full rounded-none opacity-60" />
        <div className="relative flex h-full items-end justify-center px-4 pb-8 pt-10 text-center md:items-end md:justify-start md:px-16 lg:px-24">
          <div className="max-w-2xl space-y-3 w-full text-center md:text-left">
            <div className="hidden sm:block">
              <Skeleton className="h-5 w-32 rounded mx-auto sm:mx-0" />
            </div>
            <Skeleton className="h-8 w-full max-w-lg rounded sm:h-14" />
            <Skeleton className="h-4 w-72 rounded mx-auto sm:mx-0" />
            <div className="flex gap-2 pt-1 justify-center md:justify-start">
              <Skeleton className="h-9 w-20 rounded-md sm:h-12 sm:w-28" />
              <Skeleton className="h-9 w-20 rounded-md sm:h-12 sm:w-32" />
            </div>
          </div>
        </div>
      </div>
      <div className="relative z-10 space-y-6 px-4 sm:px-8 md:mt-12">
        {isHome && <RowSkeleton />}
        {[1, 2, 3, 4, 5].map((i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="space-y-4 py-4">
      <Skeleton className="h-8 sm:h-9 w-52 rounded" />
      <div className="flex gap-2 sm:gap-3 overflow-hidden px-4 sm:px-8">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="w-[200px] sm:w-[260px] aspect-[2/3] rounded-lg shrink-0" />
        ))}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/browse")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ kind: search.kind }),
  loader: async ({ deps }) => {
    return await loadBrowseData(deps.kind as BrowseKind);
  },
  head: () => ({ meta: [{ title: "Browse — StreamFlix" }] }),
  component: BrowsePage,
  pendingComponent: BrowseSkeleton,
});

function BrowsePage() {
  const { heroSlides, rows } = Route.useLoaderData();
  const { kind } = Route.useSearch();
  const [continueRow, setContinueRow] = useState<{
    title: string;
    items: { movie: Movie; progress: number }[];
  } | null>(null);
  const [watchedRow, setWatchedRow] = useState<{
    title: string;
    items: Movie[];
    reasons: Record<string, string>;
    reasonLinks: Record<string, string>;
  } | null>(null);
  const [pickedRow, setPickedRow] = useState<{
    title: string;
    items: Movie[];
    reasons: Record<string, string>;
    reasonLinks: Record<string, string>;
  } | null>(null);
  useEffect(() => {
    const update = async () => {
      const localItems = getContinueWatching();
      let items = localItems.map((c) => ({
        movie: continueToMovie(c),
        progress: (c.progress / Math.max(c.duration, 1)) * 100,
      }));
      try {
        const fsItems = await getContinueWatchingFromFirestore();
        if (fsItems.length > 0) {
          const merged = new Map<string, { movie: Movie; progress: number }>();
          for (const item of items) merged.set(item.movie.id, item);
          for (const fs of fsItems) {
            merged.set(fs.movieId, {
              movie: fsToMovie(fs),
              progress: (fs.progress / Math.max(fs.duration, 1)) * 100,
            });
          }
          items = Array.from(merged.values()).sort((a, b) => {
            const aFs = fsItems.find((f) => f.movieId === a.movie.id);
            const bFs = fsItems.find((f) => f.movieId === b.movie.id);
            return (bFs?.updatedAt ?? 0) - (aFs?.updatedAt ?? 0);
          });
        }
      } catch {}
      setContinueRow(items.length > 0 ? { title: "Continue Watching", items } : null);
    };
    update();
    window.addEventListener("storage", update);
    window.addEventListener("focus", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("focus", update);
    };
  }, []);

  useEffect(() => {
    if (kind !== "home" || typeof window === "undefined") return;
    let cancelled = false;

    const loadWatchedRow = async () => {
      const history = getWatchHistory();
      const seeds = new Map<string, RecommendSeed>();
      for (const item of history) {
        seeds.set(item.id, {
          id: item.id,
          title: item.title,
          watchedAt: item.watchedAt,
          genreIds: item.genreIds,
        });
      }
      try {
        const fsItems = await getContinueWatchingFromFirestore();
        for (const fs of fsItems) {
          const existing = seeds.get(fs.movieId);
          seeds.set(fs.movieId, {
            id: fs.movieId,
            title: fs.title,
            watchedAt: Math.max(existing?.watchedAt ?? 0, fs.updatedAt),
            genreIds: fs.genreIds,
          });
        }
      } catch {}
      if (seeds.size === 0) {
        if (!cancelled) setWatchedRow(null);
        return;
      }

      try {
        const result = await getPersonalizedRecommendations(Array.from(seeds.values()));
        if (!cancelled) {
          setWatchedRow(
            result.items.length
              ? {
                  title: result.basedOnTitle
                    ? `Because You Watched ${result.basedOnTitle}`
                    : "Because You Watched",
                  items: result.items,
                  reasons: result.reasons,
                  reasonLinks: result.reasonLinks,
                }
              : null,
          );
        }
      } catch {
        if (!cancelled) setWatchedRow(null);
      }
    };

    loadWatchedRow();
    window.addEventListener("storage", loadWatchedRow);
    window.addEventListener("focus", loadWatchedRow);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", loadWatchedRow);
      window.removeEventListener("focus", loadWatchedRow);
    };
  }, [kind]);

  useEffect(() => {
    if (kind !== "home" || typeof window === "undefined") return;
    const u = auth.currentUser;
    if (!u) return;
    let cancelled = false;
    const loadPicked = async () => {
      try {
        const genres = await getFavoriteGenres(u.uid);
        if (genres.length === 0) {
          if (!cancelled) setPickedRow(null);
          return;
        }
        const seen = new Set<string>();
        const items: Movie[] = [];
        const reasons: Record<string, string> = {};
        for (const gid of genres.slice(0, 5)) {
          const label = GENRE_OPTIONS.find((g) => g.id === gid)?.name ?? "this genre";
          const batch = await searchByGenre(String(gid)).catch(() => [] as Movie[]);
          for (const m of batch) {
            if (seen.has(m.id)) continue;
            seen.add(m.id);
            items.push(m);
            reasons[m.id] = `Because you like ${label}`;
            if (items.length >= 12) break;
          }
          if (items.length >= 12) break;
        }
        if (!cancelled) {
          setPickedRow(
            items.length
              ? { title: "Picked for You", items, reasons, reasonLinks: {} }
              : null,
          );
        }
      } catch {
        if (!cancelled) setPickedRow(null);
      }
    };
    loadPicked();
    return () => {
      cancelled = true;
    };
  }, [kind]);

  const kidsMode = useMemo(() => isKidsProfile(), []);

  const [kidsPool, setKidsPool] = useState<Movie[]>([]);
  useEffect(() => {
    if (!kidsMode) {
      setKidsPool([]);
      return;
    }
    let cancelled = false;
    const loadPool = async () => {
      try {
        const results = await Promise.all([
          fetchPopular().catch(() => [] as Movie[]),
          searchByGenre("16").catch(() => [] as Movie[]),
          searchByGenre("12").catch(() => [] as Movie[]),
          searchByGenre("10751").catch(() => [] as Movie[]),
        ]);
        const seen = new Set<string>();
        const pool = filterKidsContent(results.flat()).filter((m) => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
        if (!cancelled) setKidsPool(pool);
      } catch {
        /* keep pool empty */
      }
    };
    loadPool();
    return () => {
      cancelled = true;
    };
  }, [kidsMode]);

  const fillRow = useMemo(() => {
    return (items: Movie[], target = 12) => {
      if (!kidsMode) return items;
      const out = [...items];
      const seenIds = new Set(out.map((m) => m.id));
      for (const p of kidsPool) {
        if (out.length >= target) break;
        if (seenIds.has(p.id)) continue;
        seenIds.add(p.id);
        out.push(p);
      }
      return out;
    };
  }, [kidsMode, kidsPool]);

  const filteredHeroSlides = useMemo(() => {
    if (!kidsMode) return heroSlides;
    return filterKidsContent(heroSlides);
  }, [kidsMode, heroSlides]);

  const filteredRows = useMemo(() => {
    if (!kidsMode) return rows;
    return rows
      .filter((r) => r.title !== "Award-Winning Dramas")
      .map((r) => ({
        ...r,
        items: fillRow(filterKidsContent(r.items)),
      }));
  }, [kidsMode, rows, fillRow]);

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <HeroBanner slides={filteredHeroSlides} />
      <div className="relative z-10 mt-0 md:mt-12 space-y-4 md:space-y-8">
        {kind === "new" && (
          <div className="px-4 sm:px-8 pt-2">
            <Link
              to="/calendar"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm text-foreground transition hover:border-primary"
            >
              <span aria-hidden>📅</span> Release Calendar — get notified when titles arrive
            </Link>
          </div>
        )}
        {continueRow && kind === "home" && (
          <section className="space-y-3 py-4">
            <h2 className="px-4 sm:px-8 text-lg sm:text-xl font-semibold tracking-tight">
              Continue Watching
            </h2>
            <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 sm:px-8">
              {continueRow.items
                .filter((item) => !kidsMode || filterKidsContent([item.movie]).length > 0)
                .map((item) => (
                  <MovieCard key={item.movie.id} movie={item.movie} progress={item.progress} />
                ))}
            </div>
          </section>
        )}
        {watchedRow && kind === "home" && (
          <Row
            title={watchedRow.title}
            items={kidsMode ? fillRow(filterKidsContent(watchedRow.items)) : watchedRow.items}
            reasons={watchedRow.reasons}
            reasonLinks={watchedRow.reasonLinks}
          />
        )}
        {!watchedRow && pickedRow && kind === "home" && (
          <Row
            title={pickedRow.title}
            items={kidsMode ? fillRow(filterKidsContent(pickedRow.items)) : pickedRow.items}
            reasons={pickedRow.reasons}
            reasonLinks={pickedRow.reasonLinks}
          />
        )}
        {!kidsMode && kind === "home" && (
          <section className="space-y-3 py-4">
            <h2 className="px-4 sm:px-8 text-lg sm:text-xl font-semibold tracking-tight">
              Explore moods
            </h2>
            <div className="flex flex-wrap gap-2 px-4 sm:px-8">
              {[
                { id: "28", name: "Action" },
                { id: "35", name: "Comedy" },
                { id: "878", name: "Sci-Fi" },
                { id: "27", name: "Horror" },
                { id: "10749", name: "Romance" },
                { id: "18", name: "Drama" },
                { id: "16", name: "Animation" },
                { id: "53", name: "Thriller" },
              ].map((m) => (
                <Link
                  key={m.id}
                  to="/explore/$genreId"
                  params={{ genreId: m.id }}
                  search={{ q: m.name }}
                  className="rounded-full border border-border bg-card/60 px-4 py-2 text-sm text-foreground transition hover:border-primary hover:bg-card"
                >
                  {m.name}
                </Link>
              ))}
              <Link
                to="/explore"
                className="rounded-full border border-primary/60 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
              >
                All moods →
              </Link>
            </div>
          </section>
        )}
        {filteredRows.map((r: { title: string; items: Movie[] }) => (
          <Row key={r.title} title={r.title} items={r.items} />
        ))}
      </div>
      <ReleaseReminderBanner />
      <Footer />
    </div>
  );
}
