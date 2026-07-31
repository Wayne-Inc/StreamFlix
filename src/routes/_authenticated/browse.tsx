import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Navbar } from "@/components/streamflix/Navbar";
import { HeroBanner } from "@/components/streamflix/HeroBanner";
import { Row } from "@/components/streamflix/Row";
import { MovieCard } from "@/components/streamflix/MovieCard";
import { Footer } from "@/components/streamflix/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { List, ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { loadBrowseData, type BrowseKind } from "@/lib/streamflix-data";
import { fetchTraktWatchlist } from "@/lib/api/trakt";
import type { Movie } from "@/lib/types";
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
import { getMyList } from "@/lib/my-list";
import { isKidsProfile, filterKidsContent } from "@/lib/kids-mode";
import {
  getPersonalizedRecommendations,
  type RecommendSeed,
} from "@/lib/recommendations";

const searchSchema = z.object({
  kind: z.enum(["home", "movies", "tv", "new", "my-list"]).catch("home").default("home"),
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
      <div className="min-h-[45vh] h-[55vh] w-full bg-surface/50 sm:min-h-[420px] sm:h-[75vh] lg:min-h-[560px] lg:h-[88vh]">
        <div className="flex h-full items-end justify-center px-4 pb-8 pt-10 text-center md:items-end md:justify-start md:px-16 lg:px-24">
          <div className="max-w-2xl space-y-3 w-full text-center md:text-left">
            <div className="hidden sm:block">
              <Skeleton className="h-4 w-32 rounded mx-auto sm:mx-0" />
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
    <div className="space-y-3 py-4">
      <Skeleton className="h-5 w-48 rounded" />
      <div className="flex gap-2 sm:gap-3 overflow-hidden px-4 sm:px-8">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="w-[200px] sm:w-[260px] aspect-[2/3] rounded-md shrink-0" />
        ))}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/browse")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ kind: search.kind }),
  loader: async ({ deps }) => {
    if (deps.kind === "my-list") {
      let watchlist: Movie[] = [];
      try {
        const items = await getMyList();
        watchlist = items
          .filter((i) => i.poster || i.title)
          .map((i) => ({
            id: i.tmdbId,
            title: i.title,
            year: i.year,
            poster: i.poster ?? "",
            backdrop: "",
            description: "",
            rating: "",
            runtime: "",
            genres: [],
            genreIds: [],
            cast: [],
            castPfp: [],
            director: "",
            directorId: "",
            match: 0,
          }));
      } catch {}
      return {
        heroSlides: [],
        rows: watchlist.length ? [{ title: "My List", items: watchlist }] : [],
      };
    }
    return await loadBrowseData(deps.kind as BrowseKind);
  },
  head: () => ({ meta: [{ title: "Browse — StreamFlix" }] }),
  component: BrowsePage,
  pendingComponent: BrowseSkeleton,
});

type SortMode = "recent" | "title-asc" | "title-desc";

function BrowsePage() {
  const { heroSlides, rows } = Route.useLoaderData();
  const { kind } = Route.useSearch();
  const [continueRow, setContinueRow] = useState<{
    title: string;
    items: { movie: Movie; progress: number }[];
  } | null>(null);
  const [sortBy, setSortBy] = useState<SortMode>("recent");
  const [traktWatchlist, setTraktWatchlist] = useState<Movie[] | null>(null);
  const [traktWatchlistLoaded, setTraktWatchlistLoaded] = useState(false);
  const [watchedRow, setWatchedRow] = useState<{ title: string; items: Movie[] } | null>(null);

  useEffect(() => {
    const loadTraktWatchlist = async () => {
      if (!isMyList || typeof window === "undefined") {
        setTraktWatchlistLoaded(true);
        return;
      }

      const raw = window.localStorage.getItem("streamflix:trakt");
      if (!raw) {
        setTraktWatchlistLoaded(true);
        return;
      }

      try {
        const conn = JSON.parse(raw);
        if (conn?.expiresAt && Date.now() > conn.expiresAt) {
          setTraktWatchlistLoaded(true);
          return;
        }

        const items = await fetchTraktWatchlist({ data: { token: conn.accessToken } });
        setTraktWatchlist(
          items.map((item: any) => ({
            id: item.tmdbId,
            title: item.title,
            year: item.year,
            poster: item.poster ?? "",
            backdrop: "",
            description: "",
            rating: "",
            runtime: "",
            genres: [],
            genreIds: [],
            cast: [],
            castPfp: [],
            director: "",
            directorId: "",
            match: 0,
          })),
        );
      } catch {
      } finally {
        setTraktWatchlistLoaded(true);
      }
    };

    loadTraktWatchlist();

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
        seeds.set(item.id, { id: item.id, watchedAt: item.watchedAt, genreIds: item.genreIds });
      }
      try {
        const fsItems = await getContinueWatchingFromFirestore();
        for (const fs of fsItems) {
          const existing = seeds.get(fs.movieId);
          seeds.set(fs.movieId, {
            id: fs.movieId,
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
        const items = await getPersonalizedRecommendations(Array.from(seeds.values()));
        if (!cancelled) {
          setWatchedRow(items.length ? { title: "Because You Watched", items } : null);
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

  const isMyList = kind === "my-list";

  const sortedRows: { title: string; items: Movie[] }[] = useMemo(() => {
    if (!isMyList) return rows;
    return rows.map((r) => {
      const sorted = [...r.items].sort((a, b) => {
        if (sortBy === "title-asc") return (a.title ?? "").localeCompare(b.title ?? "");
        if (sortBy === "title-desc") return (b.title ?? "").localeCompare(a.title ?? "");
        return 0;
      });
      return { ...r, items: sorted };
    });
  }, [rows, sortBy, isMyList]);

  const displayedRows = useMemo(() => {
    if (!isMyList) return sortedRows;
    const merged = new Map<string, Movie>();
    sortedRows.forEach((row) => row.items.forEach((movie) => merged.set(movie.id, movie)));
    traktWatchlist?.forEach((movie) => merged.set(movie.id, movie));
    return [{ title: "My List", items: Array.from(merged.values()) }];
  }, [isMyList, sortedRows, traktWatchlist]);

  const kidsMode = useMemo(() => isKidsProfile(), []);

  const filteredHeroSlides = useMemo(() => {
    if (!kidsMode) return heroSlides;
    return filterKidsContent(heroSlides);
  }, [kidsMode, heroSlides]);

  const filteredRows = useMemo(() => {
    if (!kidsMode) return displayedRows;
    return displayedRows.map((r) => ({
      ...r,
      items: filterKidsContent(r.items),
    }));
  }, [kidsMode, displayedRows]);

  const showEmptyMyList = isMyList && traktWatchlistLoaded && displayedRows[0]?.items.length === 0;

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      {!isMyList && <HeroBanner slides={filteredHeroSlides} />}
      <div
        className={`relative z-10 ${isMyList ? "pt-24" : "mt-0 md:mt-12"} space-y-4 md:space-y-8`}
      >
        {!isMyList && continueRow && kind === "home" && (
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
        {!isMyList && watchedRow && kind === "home" && (
          <Row
            title={watchedRow.title}
            items={kidsMode ? filterKidsContent(watchedRow.items) : watchedRow.items}
          />
        )}
        {rows.length === 0 && isMyList && (
          <div className="flex flex-col items-center justify-center px-4 pt-16 text-center">
            <List className="size-12 text-muted-foreground/40" />
            <p className="mt-4 text-lg font-medium">Your list is empty</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse movies and add them to your list to see them here.
            </p>
          </div>
        )}
        {isMyList && rows.length > 0 && (
          <div className="flex items-center gap-2 px-4 sm:px-8 pt-4 pb-2">
            <ArrowUpDown className="size-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortMode)}>
              <SelectTrigger className="w-44 h-9 text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently Added</SelectItem>
                <SelectItem value="title-asc">Title A-Z</SelectItem>
                <SelectItem value="title-desc">Title Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {filteredRows.map((r: { title: string; items: Movie[] }) => (
          <Row key={r.title} title={r.title} items={r.items} />
        ))}
      </div>
      <Footer />
    </div>
  );
}
