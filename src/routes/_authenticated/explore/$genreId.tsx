import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { ChevronLeft, ChevronRight, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Navbar } from "@/components/streamflix/Navbar";
import { Footer } from "@/components/streamflix/Footer";
import { MovieCard } from "@/components/streamflix/MovieCard";
import { HeroBannerSkeleton, Skeleton, ExploreGenreSkeleton } from "@/components/ui/skeleton";
import { getGenres, searchByGenre } from "@/lib/streamflix-data";
import type { Movie } from "@/lib/types";
import { isKidsProfile, filterKidsContent } from "@/lib/kids-mode";

const exploreSearchSchema = z.object({
  q: z.string().optional().catch(""),
});

export const Route = createFileRoute("/_authenticated/explore/$genreId")({
  validateSearch: exploreSearchSchema,
  loader: async ({ params }) => {
    const [genres, items] = await Promise.all([
      getGenres(),
      searchByGenre(params.genreId).catch(() => [] as Movie[]),
    ]);
    const genreName = genres.find((g) => String(g.id) === params.genreId)?.name ?? "Explore";
    return { genreId: params.genreId, genreName, genres, items };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.genreName || "Explore"} — StreamFlix` }],
  }),
  pendingComponent: () => (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <ExploreGenreSkeleton />
    </div>
  ),
  component: ExploreGenrePage,
});

function ExploreGenrePage() {
  const { genreId, genres, items } = Route.useLoaderData();
  const { q } = Route.useSearch();
  const [page, setPage] = useState(1);
  const [showAllGenres, setShowAllGenres] = useState(false);
  // Default view shows as many genres as fit on screen: 2 mobile, 3 sm, 4 md, 5 lg, 6 xl
  const [defaultGenresCount, setDefaultGenresCount] = useState(5);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setDefaultGenresCount(w >= 1280 ? 6 : w >= 1024 ? 5 : w >= 768 ? 4 : w >= 640 ? 3 : 2);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const navigate = useNavigate();

  const kidsMode = isKidsProfile();
  const safeGenres = genres;
  const safeItems = kidsMode ? filterKidsContent(items) : items;
  const genreName = safeGenres.find((g) => String(g.id) === genreId)?.name || q || "Explore";
  const hero = safeItems[0];
  const visibleGenres = showAllGenres ? safeGenres : safeGenres.slice(0, defaultGenresCount);

  const pageCount = Math.max(1, Math.ceil(safeItems.length / 24));
  const visible = safeItems.slice((page - 1) * 24, page * 24);

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      {/* Cinematic hero */}
      <section className="relative flex h-[42vh] items-end overflow-hidden sm:h-[52vh]">
        {hero?.backdrop ? (
          <img src={hero.backdrop} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-surface to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="relative z-10 w-full px-4 pb-8 sm:px-8 md:px-16">
          <div className="flex items-center gap-2 text-emerald-400">
            <Sparkles className="size-5" />
            <span className="text-sm font-semibold uppercase tracking-widest">Mood</span>
          </div>
          <h1 className="mt-1 text-4xl font-black tracking-tight sm:text-6xl">{genreName}</h1>
          <p className="mt-2 max-w-xl text-sm text-foreground/80 sm:text-base">
            {safeItems.length} titles hand-picked to match this vibe.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-[1800px] px-4 pb-16 md:pb-20 sm:px-8">
        {/* Mood chips — one row by default (not scrollable), Show All reveals all wrapped in rows */}
        <div className={`mt-8 flex items-center gap-2 ${showAllGenres ? "flex-wrap" : "flex-nowrap"}`}>
          {visibleGenres.map((g) => {
            const active = String(g.id) === genreId;
            return (
              <Link
                key={g.id}
                to="/explore/$genreId"
                params={{ genreId: String(g.id) }}
                search={{ q: g.name }}
                onClick={() => setPage(1)}
                className={`rounded-lg border px-4 py-2 text-sm transition ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                }`}
              >
                {g.name}
              </Link>
            );
          })}
          {safeGenres.length > defaultGenresCount && !showAllGenres && (
            <button
              type="button"
              onClick={() => setShowAllGenres(true)}
              className="flex flex-nowrap items-center gap-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground whitespace-nowrap transition hover:bg-primary hover:text-primary-foreground"
            >
              Show all ({safeGenres.length})
              <ChevronDown className="size-4" />
            </button>
          )}
          {showAllGenres && safeGenres.length > defaultGenresCount && (
            <button
              type="button"
              onClick={() => setShowAllGenres(false)}
              className="flex flex-nowrap items-center gap-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground whitespace-nowrap transition hover:bg-primary hover:text-primary-foreground"
            >
              Show less
              <ChevronUp className="size-4" />
            </button>
          )}
        </div>

        {safeItems.length > 0 ? (
          <div className="mt-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
              {visible.map((m) => (
                <button
                  key={m.id}
                  onClick={() => navigate({ to: "/movie/$id", params: { id: m.id } })}
                  className="w-full text-left"
                >
                  <MovieCard movie={m} fluid />
                </button>
              ))}
            </div>
            {pageCount > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" /> Previous
                </button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`rounded-md px-3 py-2 text-sm ${
                      p === page
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={page === pageCount}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  Next <ChevronRight className="size-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-12 text-center text-sm text-muted-foreground">No titles found.</p>
        )}
      </main>
      <Footer />
    </div>
  );
}
