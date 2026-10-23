import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Compass, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Navbar } from "@/components/streamflix/Navbar";
import { Footer } from "@/components/streamflix/Footer";
import { MovieCard } from "@/components/streamflix/MovieCard";
import { Row } from "@/components/streamflix/Row";
import { RowSkeleton } from "@/components/streamflix/RowSkeleton";
import { HeroBannerSkeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { getGenres, loadMovies, loadTv } from "@/lib/streamflix-data";
import { fetchPopular } from "@/lib/api/tmdb";
import type { Movie } from "@/lib/types";
import { isKidsProfile, filterKidsContent } from "@/lib/kids-mode";

export const Route = createFileRoute("/_authenticated/explore/")({
  loader: async () => {
    const [genres, moviesData, tvData, popular] = await Promise.all([
      getGenres(),
      loadMovies(),
      loadTv(),
      fetchPopular()
    ]);
    return { genres, moviesData, tvData, items: popular };
  },
  head: () => ({ meta: [{ title: "Explore — StreamFlix" }] }),
  pendingComponent: () => (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <HeroBannerSkeleton />
      <main className="mx-auto max-w-[1800px] px-4 pb-16 md:pb-20 sm:px-8">
        <div className="mt-8 flex flex-wrap gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
        <div className="mt-10 space-y-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  ),
  component: ExplorePage,
});

function ExplorePage() {
  const { genres, moviesData, tvData } = Route.useLoaderData();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const kidsMode = isKidsProfile();
  const safeGenres = genres;
  const safeMoviesRows = moviesData.rows.map(row => ({
    ...row,
    items: kidsMode ? filterKidsContent(row.items) : row.items
  })).filter(row => row.items.length > 0);
  const safeTvRows = tvData.rows.map(row => ({
    ...row,
    items: kidsMode ? filterKidsContent(row.items) : row.items
  })).filter(row => row.items.length > 0);

  // Combine and take first 5 rows for 5 slideshows
  const allRows = [...safeMoviesRows, ...safeTvRows].slice(0, 5);

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

      <main className="mx-auto max-w-[1800px] px-4 pb-16 md:pb-20 sm:px-8">
        <div className="mt-8 flex flex-wrap gap-2">
          {safeGenres.slice(0, 12).map((g) => (
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

        {/* 5 Slideshows using Row components */}
        <div className="mt-10 space-y-8">
          {allRows.map((row, index) => (
            <Row
              key={row.title + index}
              title={row.title}
              items={row.items.slice(0, 20)}
            />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
