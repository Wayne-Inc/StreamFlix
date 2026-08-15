import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { z } from "zod";
import { Navbar } from "@/components/streamflix/Navbar";
import { HeroBanner } from "@/components/streamflix/HeroBanner";
import { Row } from "@/components/streamflix/Row";
import { MovieCard } from "@/components/streamflix/MovieCard";
import { Footer } from "@/components/streamflix/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { RowSkeleton } from "@/components/streamflix/RowSkeleton";
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
import { getMyList, MY_LIST_EVENT, type MyListEntry } from "@/lib/my-list";
import { getMyListFromFirestore } from "@/lib/my-list-firestore";
import {
  getContinueWatchingFromFirestore,
  toMovie as fsToMovie,
} from "@/lib/continue-watching-firestore";
import { getWatchHistoryFromFirestore } from "@/lib/history-firestore";
import { isKidsProfile, filterKidsContent, filterKidsHeroSlides } from "@/lib/kids-mode";
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
      <div className="relative min-h-[58vh] h-[70vh] w-full overflow-hidden bg-surface/60 sm:min-h-[480px] sm:h-[75vh] lg:min-h-[580px] lg:h-[85vh] xl:h-[88vh]">
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
      <div className="relative z-10 space-y-6 md:mt-12">
        {isHome && <RowSkeleton />}
        {[1, 2, 3, 4, 5].map((i) => (
          <RowSkeleton key={i} />
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
  const data = Route.useLoaderData();
  const heroSlides: Movie[] = data.heroSlides;
  const top10Today: Movie[] = data.top10Today;
  const genreGroups: { id: string; name: string; items: Movie[] }[] = data.genreGroups;
  const rows: { title: string; items: Movie[] }[] = data.rows;
  const { kind } = Route.useSearch();
  const [activeGenreId, setActiveGenreId] = useState(genreGroups[0]?.id ?? "");
  const [genreMenuOpen, setGenreMenuOpen] = useState(false);
  const genreMenuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!genreMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (genreMenuRef.current && !genreMenuRef.current.contains(e.target as Node)) {
        setGenreMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [genreMenuOpen]);
  const activeGenre = genreGroups.find((g) => g.id === activeGenreId) ?? genreGroups[0];
  const [top10Ref, setTop10Ref] = useState<HTMLDivElement | null>(null);
  const [top10Scroll, setTop10Scroll] = useState({ left: 0, viewport: 0, width: 0 });
  const [continueRow, setContinueRow] = useState<{
    title: string;
    items: { movie: Movie; progress: number }[];
  } | null>(null);
  const [continueLoading, setContinueLoading] = useState(true);
  const [listRow, setListRow] = useState<Movie[] | null>(null);
  const [watchedRow, setWatchedRow] = useState<{
    title: string;
    items: Movie[];
    reasons: Record<string, string>;
    reasonLinks: Record<string, string>;
  } | null>(null);
  const [watchedLoading, setWatchedLoading] = useState(false);
  const [pickedRow, setPickedRow] = useState<{
    title: string;
    items: Movie[];
    reasons: Record<string, string>;
    reasonLinks: Record<string, string>;
  } | null>(null);
  const [pickedLoading, setPickedLoading] = useState(false);
  useEffect(() => {
    const update = async () => {
      setContinueLoading(true);
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
      setContinueLoading(false);
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
    if (kind !== "home" || typeof window === "undefined") {
      setListRow(null);
      return;
    }
    let cancelled = false;
    const update = async () => {
      try {
        const local = getMyList();
        const merged = new Map<string, MyListEntry>();
        for (const e of local) merged.set(e.id, e);
        try {
          const fs = await getMyListFromFirestore();
          for (const e of fs) {
            const existing = merged.get(e.id);
            if (!existing || e.addedAt > existing.addedAt) merged.set(e.id, e);
          }
        } catch {}
        if (!cancelled) {
          setListRow(
            Array.from(merged.values())
              .sort((a, b) => b.addedAt - a.addedAt)
              .map((e) => e.movie),
          );
        }
      } catch {
        if (!cancelled) setListRow(getMyList().map((e) => e.movie));
      }
    };
    update();
    window.addEventListener("storage", update);
    window.addEventListener("focus", update);
    window.addEventListener(MY_LIST_EVENT, update);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", update);
      window.removeEventListener("focus", update);
      window.removeEventListener(MY_LIST_EVENT, update);
    };
  }, [kind]);

  useEffect(() => {
    if (kind !== "home" || typeof window === "undefined") return;
    let cancelled = false;
    let lastFingerprint = "";
    let timer: ReturnType<typeof setTimeout> | undefined;

    const buildSeeds = async () => {
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
      try {
        const fsHistory = await getWatchHistoryFromFirestore();
        for (const h of fsHistory) {
          const existing = seeds.get(h.id);
          seeds.set(h.id, {
            id: h.id,
            title: h.title,
            watchedAt: Math.max(existing?.watchedAt ?? 0, h.watchedAt),
            genreIds: h.genreIds,
          });
        }
      } catch {}
      return seeds;
    };

    // Fingerprint only the stable watch history (completed titles). Continue-watching
    // progress updates its updatedAt on every tick, so it must not trigger a reload.
    const fingerprintOfHistory = async () => {
      const parts = getWatchHistory().map(
        (h) => `${h.id}:${h.watchedAt}:${(h.genreIds || []).join(",")}`,
      );
      try {
        const fsHistory = await getWatchHistoryFromFirestore();
        for (const h of fsHistory) {
          parts.push(`${h.id}:${h.watchedAt}:${(h.genreIds || []).join(",")}`);
        }
      } catch {}
      return parts.sort().join("|");
    };

    const loadWatchedRow = async () => {
      try {
        const fingerprint = await fingerprintOfHistory();
        if (cancelled) return;
        if (fingerprint === lastFingerprint) return;
        lastFingerprint = fingerprint;
        const seeds = await buildSeeds();
        if (cancelled) return;
        if (seeds.size === 0) {
          setWatchedRow(null);
          setWatchedLoading(false);
          return;
        }
        setWatchedLoading(true);
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
      } finally {
        if (!cancelled) setWatchedLoading(false);
      }
    };

    const scheduleReload = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (!cancelled) loadWatchedRow();
      }, 600);
    };

    loadWatchedRow();
    window.addEventListener("storage", scheduleReload);
    window.addEventListener("sf:watchedUpdated", scheduleReload);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener("storage", scheduleReload);
      window.removeEventListener("sf:watchedUpdated", scheduleReload);
    };
  }, [kind]);

  useEffect(() => {
    if (kind !== "home" || typeof window === "undefined") return;
    const u = auth.currentUser;
    if (!u) return;
    let cancelled = false;
    const loadPicked = async () => {
      setPickedLoading(true);
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
            items.length ? { title: "Picked for You", items, reasons, reasonLinks: {} } : null,
          );
        }
      } catch {
        if (!cancelled) setPickedRow(null);
      } finally {
        if (!cancelled) setPickedLoading(false);
      }
    };
    loadPicked();
    return () => {
      cancelled = true;
    };
  }, [kind]);

  const kidsMode = useMemo(() => isKidsProfile(), []);

  useEffect(() => {
    const el = top10Ref;
    if (!el) return;
    const measure = () =>
      setTop10Scroll({ left: el.scrollLeft, viewport: el.clientWidth, width: el.scrollWidth });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const onScroll = () =>
      setTop10Scroll({ left: el.scrollLeft, viewport: el.clientWidth, width: el.scrollWidth });
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, [top10Ref, top10Today.length]);

  const scrollTop10 = (dir: 1 | -1) => {
    if (!top10Ref) return;
    top10Ref.scrollBy({ left: dir * (top10Ref.clientWidth * 0.9), behavior: "smooth" });
  };

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
    return filterKidsHeroSlides(heroSlides);
  }, [kidsMode, heroSlides]);

  const filteredRows = useMemo(() => {
    if (!kidsMode) return rows;
    return rows.map((r) => ({ ...r, items: fillRow(filterKidsContent(r.items)) }));
  }, [kidsMode, rows, fillRow]);

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <HeroBanner slides={filteredHeroSlides} />
      <div className="relative z-10 mt-0 md:mt-12 space-y-6 md:space-y-12">
        {kind === "new" && (
          <div className="px-4 sm:px-8 pt-2">
            <Link
              to="/calendar"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm text-foreground transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 hover:border-primary"
            >
              <span aria-hidden>📅</span> Release Calendar — get notified when titles arrive
            </Link>
          </div>
        )}
        {kind === "home" && continueLoading && <RowSkeleton />}
        {continueRow && kind === "home" && (
          <section className="space-y-4 py-4">
            <h2 className="px-4 sm:px-8 mb-4 sm:mb-6 text-lg sm:text-xl font-semibold tracking-tight">
              Continue Watching
            </h2>
            <div className="scrollbar-hide flex gap-4 sm:gap-6 overflow-x-auto px-4 sm:px-8">
              {continueRow.items
                .filter((item) => !kidsMode || filterKidsContent([item.movie]).length > 0)
                .map((item) => (
                  <MovieCard key={item.movie.id} movie={item.movie} progress={item.progress} />
                ))}
            </div>
          </section>
        )}
        {kind === "home" && listRow && listRow.length > 0 && (
          <Row title="My List" items={kidsMode ? fillRow(filterKidsContent(listRow)) : listRow} />
        )}
        {kind === "home" && (watchedLoading || pickedLoading) && <RowSkeleton />}
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
        {kind === "home" && top10Today.length > 0 && (
          <section className="space-y-4 py-4">
            <h2 className="px-4 sm:px-8 mb-4 sm:mb-6 text-2xl sm:text-3xl font-bold tracking-tight">
              Top 10 Today
            </h2>
            <div className="relative">
              {top10Scroll.left > 2 && (
                <button
                  type="button"
                  onClick={() => scrollTop10(-1)}
                  aria-label="Scroll top 10 left"
                  className="absolute left-1 top-1/2 z-30 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/90 text-foreground shadow-lg backdrop-blur transition hover:bg-primary hover:text-primary-foreground sm:grid"
                >
                  <ChevronLeft className="size-5" />
                </button>
              )}
              {top10Scroll.viewport > 0 &&
                top10Scroll.left + top10Scroll.viewport < top10Scroll.width - 2 && (
                <button
                  type="button"
                  onClick={() => scrollTop10(1)}
                  aria-label="Scroll top 10 right"
                  className="absolute right-1 top-1/2 z-30 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/90 text-foreground shadow-lg backdrop-blur transition hover:bg-primary hover:text-primary-foreground sm:grid"
                >
                  <ChevronRight className="size-5" />
                </button>
              )}
              <div
                ref={setTop10Ref}
                className="scrollbar-hide flex gap-3 sm:gap-5 overflow-x-auto scroll-smooth px-4 sm:px-8"
              >
                {(kidsMode ? filterKidsContent(top10Today) : top10Today).map((m, i) => (
                  <MovieCard key={m.id} movie={m} rank={i + 1} />
                ))}
              </div>
            </div>
          </section>
        )}
        {kind === "home" && genreGroups.length > 0 && activeGenre && (
          <section className="space-y-4 py-4">
            <div className="px-4 sm:px-8">
              <div ref={genreMenuRef} className="relative inline-block">
                <button
                  type="button"
                  onClick={() => setGenreMenuOpen((v) => !v)}
                  aria-expanded={genreMenuOpen}
                  aria-haspopup="listbox"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/80 px-4 py-2 text-lg font-bold tracking-tight text-foreground shadow-lg backdrop-blur transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {activeGenre.name}
                  <ChevronDown
                    className={`size-4 text-muted-foreground transition-transform duration-200 ${
                      genreMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {genreMenuOpen && (
                  <ul
                    role="listbox"
                    className="absolute left-0 top-full z-50 mt-2 w-60 max-h-80 overflow-y-auto rounded-xl border border-border bg-popover p-1.5 shadow-2xl backdrop-blur-xl"
                  >
                    {genreGroups.map((g) => (
                      <li key={g.id} role="option" aria-selected={g.id === activeGenre.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveGenreId(g.id);
                            setGenreMenuOpen(false);
                          }}
                          className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            g.id === activeGenre.id
                              ? "bg-primary/15 font-semibold text-primary"
                              : "text-foreground hover:bg-accent"
                          }`}
                        >
                          {g.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <Row
              key={activeGenre.id}
              hideTitle
              title={activeGenre.name}
              items={
                kidsMode ? fillRow(filterKidsContent(activeGenre.items)) : activeGenre.items
              }
            />
          </section>
        )}
        {filteredRows.map((r: { title: string; items: Movie[] }) => (
          <Row key={r.title} title={r.title} items={r.items} />
        ))}
      </div>
      <div className="flex justify-center px-4 pb-10 pt-2">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          title="Back to top"
          className="grid size-12 place-items-center rounded-full border border-border bg-card/70 text-muted-foreground shadow-lg backdrop-blur transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 hover:border-primary hover:bg-card hover:text-foreground"
        >
          <ArrowUp className="size-5" />
        </button>
      </div>
      <ReleaseReminderBanner />
      <Footer />
    </div>
  );
}
