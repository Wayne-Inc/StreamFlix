import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Navbar } from "@/components/streamflix/Navbar";
import { Footer } from "@/components/streamflix/Footer";
import { MovieCard } from "@/components/streamflix/MovieCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getGenres, searchByGenre } from "@/lib/streamflix-data";
import type { Movie } from "@/lib/types";
import { isKidsProfile, filterKidsContent, filterKidsGenres } from "@/lib/kids-mode";

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
      <section className="relative flex h-[42vh] items-end overflow-hidden sm:h-[52vh]">
        <Skeleton className="absolute inset-0 h-full w-full rounded-none opacity-60" />
        <div className="relative z-10 w-full px-4 pb-8 sm:px-8 md:px-16">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="mt-2 h-10 w-72 rounded sm:h-16" />
          <Skeleton className="mt-3 h-4 w-56 rounded" />
        </div>
      </section>
      <main className="mx-auto max-w-[1800px] px-4 pb-16 sm:px-8">
        <div className="mt-8 flex flex-wrap gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="w-full aspect-[2/3] rounded-md" />
          ))}
        </div>
      </main>
    </div>
  ),
  component: ExploreGenrePage,
});

function ExploreGenrePage() {
  const { genreId, genres, items } = Route.useLoaderData();
  const { q } = Route.useSearch();
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const kidsMode = isKidsProfile();
  const safeGenres = kidsMode ? filterKidsGenres(genres) : genres;
  const safeItems = kidsMode ? filterKidsContent(items) : items;
  const genreName = safeGenres.find((g) => String(g.id) === genreId)?.name || q || "Explore";
  const hero = safeItems[0];

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

      <main className="mx-auto max-w-[1800px] px-4 pb-16 sm:px-8">
        {/* Mood chips */}
        {!kidsMode && (
          <div className="mt-8 flex flex-wrap gap-2">
            {safeGenres.map((g) => {
              const active = String(g.id) === genreId;
              return (
                <Link
                  key={g.id}
                  to="/explore/$genreId"
                  params={{ genreId: String(g.id) }}
                  search={{ q: g.name }}
                  onClick={() => setPage(1)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
                  }`}
                >
                  {g.name}
                </Link>
              );
            })}
          </div>
        )}

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
