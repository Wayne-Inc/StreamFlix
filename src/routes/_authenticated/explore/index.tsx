import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Compass, Sparkles } from "lucide-react";
import { Navbar } from "@/components/streamflix/Navbar";
import { Footer } from "@/components/streamflix/Footer";
import { MovieCard } from "@/components/streamflix/MovieCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getGenres } from "@/lib/streamflix-data";
import { fetchPopular } from "@/lib/api/tmdb";
import type { Movie } from "@/lib/types";
import { isKidsProfile, filterKidsContent, filterKidsGenres } from "@/lib/kids-mode";

export const Route = createFileRoute("/_authenticated/explore/")({
  loader: async () => {
    const [genres, popular] = await Promise.all([getGenres(), fetchPopular()]);
    return { genres, items: popular };
  },
  head: () => ({ meta: [{ title: "Explore — StreamFlix" }] }),
  pendingComponent: () => (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <section className="relative flex h-[38vh] items-end overflow-hidden sm:h-[46vh]">
        <Skeleton className="absolute inset-0 h-full w-full rounded-none opacity-60" />
        <div className="relative z-10 w-full px-4 pb-8 sm:px-8 md:px-16">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="mt-2 h-10 w-64 rounded sm:h-14" />
          <Skeleton className="mt-3 h-4 w-72 rounded" />
        </div>
      </section>
      <main className="mx-auto max-w-[1800px] px-4 pb-16 sm:px-8">
        <div className="mt-8 flex flex-wrap gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
        <div className="mt-10">
          <Skeleton className="h-5 w-44 rounded" />
          <div className="mt-4 flex flex-wrap gap-3 justify-center">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="w-[160px] sm:w-[200px] aspect-[2/3] rounded-lg" />
            ))}
          </div>
        </div>
      </main>
    </div>
  ),
  component: ExplorePage,
});

function ExplorePage() {
  const { genres, items } = Route.useLoaderData();
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const kidsMode = isKidsProfile();
  const safeGenres = kidsMode ? filterKidsGenres(genres) : genres;
  const safeItems: Movie[] = kidsMode ? filterKidsContent(items) : items;
  const pageCount = Math.max(1, Math.ceil(safeItems.length / 24));
  const visible = safeItems.slice((page - 1) * 24, page * 24);

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      <section className="relative flex h-[38vh] items-end overflow-hidden sm:h-[46vh]">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-700/50 via-surface to-background" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="relative z-10 w-full px-4 pb-8 sm:px-8 md:px-16">
          <div className="flex items-center gap-2 text-purple-300">
            <Compass className="size-5" />
            <span className="text-sm font-semibold uppercase tracking-widest">Explore</span>
          </div>
          <h1 className="mt-1 text-4xl font-black tracking-tight sm:text-6xl">Pick a mood</h1>
          <p className="mt-2 max-w-xl text-sm text-foreground/80 sm:text-base">
            Jump into a curated mood or genre and discover something new.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-[1800px] px-4 pb-16 sm:px-8">
        {!kidsMode && (
          <div className="mt-8 flex flex-wrap gap-2">
            {safeGenres.map((g) => (
              <Link
                key={g.id}
                to="/explore/$genreId"
                params={{ genreId: String(g.id) }}
                search={{ q: g.name }}
                className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition hover:border-primary hover:text-foreground"
              >
                <Sparkles className="size-3.5 text-primary" /> {g.name}
              </Link>
            ))}
          </div>
        )}

        {safeItems.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold tracking-tight">Popular right now</h2>
            <div className="mt-4 flex flex-wrap gap-3 justify-center">
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
        )}
      </main>
      <Footer />
    </div>
  );
}
