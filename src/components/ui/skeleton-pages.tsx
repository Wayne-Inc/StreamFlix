import { Skeleton, SkeletonText, SkeletonAvatar, SkeletonImage, SkeletonButton, SkeletonCard, SkeletonList, SkeletonGrid, MovieCardSkeleton, RowSkeleton, ContinueWatchingSkeleton, PersonCardSkeleton, SeasonEpisodePickerSkeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/streamflix/Navbar";
import { Footer } from "@/components/streamflix/Footer";

/* ------------------------------------------------------------------ */
/*  Browse page skeleton – Navbar + HeroBanner + rows                 */
/* ------------------------------------------------------------------ */

export function BrowsePageSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <div className="relative w-full overflow-hidden aspect-[4/5] sm:aspect-[16/9] max-h-[95vh] min-h-[60vh] sm:min-h-[400px]">
        <SkeletonImage className="size-full" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/70 to-transparent md:h-72" />
        <div className="relative z-10 flex h-full items-end justify-center px-4 pb-10 pt-8 text-center sm:pb-8 sm:pt-10 sm:px-8 md:items-end md:justify-start">
          <div className="animate-fade-in w-full max-w-none space-y-2 sm:space-y-3 text-center md:max-w-3xl md:text-left">
            <SkeletonText className="mb-2 sm:mb-4 mx-auto md:mx-0 h-8 w-56 max-w-full rounded-md sm:h-10 sm:w-64 lg:h-12 lg:w-72" />
            <div className="mb-1.5 sm:mb-2 flex flex-wrap items-center justify-center md:justify-start gap-1.5 text-base font-normal text-white/80 tracking-wide">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-sm md:justify-start md:text-sm">
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-16 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
            <SkeletonText className="hidden md:block mx-auto md:mx-0 h-4 w-full max-w-xl rounded lg:h-5" />
            <SkeletonText className="hidden md:block mx-auto md:mx-0 h-4 w-full max-w-xl rounded lg:h-5" />
            <SkeletonText className="hidden md:block mx-auto md:mx-0 h-4 w-2/3 max-w-xl rounded lg:h-5" />
            <div className="mx-auto md:mx-0 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto md:justify-start px-4 sm:px-0">
              <SkeletonButton className="h-10 w-28 rounded-md sm:h-11 sm:w-32 lg:h-12 lg:w-36" />
              <SkeletonButton className="h-10 w-28 rounded-md sm:h-11 sm:w-36 lg:h-12 lg:w-40" />
            </div>
          </div>
          <div className="absolute bottom-3 inset-x-0 z-10 flex items-center justify-center gap-2 sm:justify-end sm:right-8 sm:inset-x-auto">
            <Skeleton className="w-8 h-2 rounded-full" />
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="w-2 h-2 rounded-full" />
          </div>
        </div>
      </div>
      <div className="relative z-10 space-y-6 md:mt-12 md:space-y-12">
        <ContinueWatchingSkeleton count={5} />
        {Array.from({ length: 5 }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Calendar page skeleton – header + month nav + grid / list         */
/* ------------------------------------------------------------------ */

export function CalendarPageSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pt-24 pb-16 sm:px-8">
        <div className="flex items-center gap-2 text-primary">
          <Skeleton className="size-6 rounded" />
          <SkeletonText className="h-5 w-32" />
        </div>
        <SkeletonText className="mt-1 h-6 sm:h-8 font-bold tracking-tight w-48" />
        <SkeletonText className="mt-2 h-4 w-32 text-muted-foreground" />
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="order-1 inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary h-9" />
          <Skeleton className="order-2 flex-1 h-8 rounded w-48" />
          <div className="order-3 flex items-center gap-2">
            <Skeleton className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground h-9" />
            <Skeleton className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground h-9" />
          </div>
        </div>
        {/* Desktop calendar grid */}
        <div className="mt-6 hidden rounded-lg border border-border bg-card/40 p-3 sm:p-5 lg:block">
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <SkeletonText key={i} className="h-6 w-full rounded text-center" />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 42 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded bg-surface/60" />
            ))}
          </div>
        </div>
        {/* Mobile list view */}
        <div className="mt-6 space-y-2 lg:hidden">
          <Skeleton className="rounded-lg border border-border bg-card/40 p-6 text-center text-sm text-muted-foreground h-24" />
        </div>
        <SkeletonText className="mt-4 h-3 w-48 text-xs text-muted-foreground" />
      </main>
      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Explore page skeleton – hero + genre chips + rows                 */
/* ------------------------------------------------------------------ */

export function ExplorePageSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <section className="relative flex h-[38vh] items-end overflow-hidden sm:h-[46vh]">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-700/50 via-surface to-background" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="relative z-10 w-full px-4 pb-8 sm:px-8 md:px-16">
          <div className="flex items-center gap-2 text-purple-300">
            <Skeleton className="size-5 rounded" />
            <SkeletonText className="h-4 w-24" />
          </div>
          <SkeletonText className="mt-1 h-10 sm:h-14 w-3/4 max-w-[400px] rounded sm:max-w-[600px]" />
          <SkeletonText className="mt-2 h-4 sm:h-5 w-1/2 max-w-xl rounded" />
        </div>
      </section>
      <main className="mx-auto max-w-[1800px] px-4 pb-16 md:pb-20 sm:px-8">
        <div className="mt-8 flex items-center gap-2 flex-nowrap">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground h-9 rounded"
            />
          ))}
          <Skeleton
            className="flex flex-nowrap items-center gap-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground whitespace-nowrap h-9 rounded"
          />
        </div>
        <div className="mt-10 space-y-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <RowSkeleton key={i} title trending={false} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Explore genre page skeleton – hero + chips + grid + pagination    */
/* ------------------------------------------------------------------ */

export function ExploreGenrePageSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <section className="relative flex h-[42vh] items-end overflow-hidden sm:h-[52vh]">
        <SkeletonImage className="absolute inset-0 size-full rounded-none bg-surface/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="relative z-10 w-full px-4 pb-8 sm:px-8 md:px-16">
          <div className="flex items-center gap-2 text-emerald-400">
            <Skeleton className="size-5 rounded" />
            <SkeletonText className="h-4 w-16" />
          </div>
          <SkeletonText className="mt-1 h-10 sm:h-14 w-3/4 max-w-[400px] rounded sm:max-w-[600px]" />
          <SkeletonText className="mt-2 h-4 sm:h-5 w-1/2 max-w-xl rounded" />
        </div>
      </section>
      <main className="mx-auto max-w-[1800px] px-4 pb-16 md:pb-20 sm:px-8 md:px-16">
        <div className="mt-8 flex items-center gap-2 flex-nowrap">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              className="rounded-lg border border-border px-4 py-2 text-sm transition h-8 rounded"
            />
          ))}
          <Skeleton
            className="flex flex-nowrap items-center gap-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground whitespace-nowrap transition h-9 rounded"
          />
        </div>
        <div className="mt-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {Array.from({ length: 12 }).map((_, i) => (
              <MovieCardSkeleton key={i} fluid />
            ))}
          </div>
          <div className="mt-8 flex items-center justify-center gap-2">
            <SkeletonButton className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground h-9 rounded" />
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonButton
                key={i}
                className="rounded-md px-3 py-2 text-sm border border-border text-muted-foreground h-9 rounded"
              />
            ))}
            <SkeletonButton className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground h-9 rounded" />
          </div>
        </div>
        <SkeletonText className="mt-12 h-4 w-32 text-center text-sm text-muted-foreground rounded" />
      </main>
      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  History page skeleton – header + items + TV groups                */
/* ------------------------------------------------------------------ */

export function HistoryPageSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pt-24 pb-12 sm:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2 sm:text-3xl">
            <Skeleton className="size-6" />
            <SkeletonText className="h-6 w-32" />
          </h1>
          <SkeletonButton size="h-8 px-3 py-2" />
        </div>
        <div className="space-y-3">
          {/* Movie items */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg border border-border bg-surface/40 p-3 sm:p-4">
              <div className="relative shrink-0">
                <SkeletonImage className="h-16 w-12 rounded sm:h-20 sm:w-14" />
              </div>
              <div className="min-w-0 flex-1">
                <SkeletonText className="truncate font-semibold text-sm sm:text-base" />
                <SkeletonText className="text-xs text-muted-foreground mt-0.5 h-3 w-24" />
                <SkeletonText className="text-xs text-muted-foreground/70 line-clamp-1 mt-1 h-3 w-32" />
                <SkeletonText className="text-[10px] text-muted-foreground/50 mt-1 h-3 w-40" />
              </div>
              <button className="shrink-0 flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-background/80 text-muted-foreground">
                <Skeleton className="size-5 sm:size-4" />
              </button>
            </div>
          ))}
          {/* TV group items */}
          <div className="rounded-lg border border-border bg-surface/40 overflow-hidden">
            <div className="flex items-center gap-4 p-3 sm:p-4">
              <div className="relative shrink-0">
                <SkeletonImage className="h-16 w-12 rounded sm:h-20 sm:w-14" />
              </div>
              <div className="min-w-0 flex-1">
                <SkeletonText className="truncate font-semibold text-sm sm:text-base" />
                <SkeletonText className="text-xs text-muted-foreground mt-0.5 h-3 w-32" />
                <SkeletonText className="text-xs text-muted-foreground/70 line-clamp-1 mt-1 h-3 w-40" />
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button className="flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-background/80 text-muted-foreground">
                  <Skeleton className="size-5 sm:size-4" />
                </button>
                <Skeleton className="size-5 sm:size-4 text-muted-foreground" />
              </div>
            </div>
            <div className="border-t border-border">
              {Array.from({ length: 3 }).map((_, i) => (
                <a key={i} className="flex items-center gap-3 px-4 py-2.5 sm:px-6">
                  <div className="shrink-0 w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                    <Skeleton className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <SkeletonText className="text-sm font-medium truncate h-4 w-24" />
                    <SkeletonText className="text-[11px] text-muted-foreground/60 h-3 w-24" />
                  </div>
                  <button className="shrink-0 flex items-center justify-center w-7 h-7 sm:w-6 sm:h-6 rounded-lg bg-background/80 text-muted-foreground/60">
                    <Skeleton className="size-4 sm:size-3.5" />
                  </button>
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  My List page skeleton – Navbar + header + fluid card grid         */
/* ------------------------------------------------------------------ */

export function MyListPageSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <main className="mx-auto max-w-[1800px] px-4 pt-24 pb-16 sm:px-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          <Skeleton className="size-6 fill-current text-primary" />
          <SkeletonText className="h-6 w-32" />
        </h1>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {Array.from({ length: 12 }).map((_, i) => (
            <MovieCardSkeleton key={i} fluid />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Profiles page skeleton – "Who's watching?" full-screen layout     */
/* ------------------------------------------------------------------ */

export function ProfilesPageSkeleton() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-background">
      <div className="absolute inset-0">
        {Array.from({ length: 3 }).map((i) => (
          <SkeletonImage key={i} className="absolute inset-0 size-full object-cover bg-surface/30" aspect="16/9" />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background" />
      </div>
      <header className="absolute inset-x-0 top-0 px-4 sm:px-12 py-5 z-10 flex items-center justify-between">
        <Skeleton className="h-8 w-32 rounded" />
        <Skeleton className="size-10 rounded-lg" />
      </header>
      <Skeleton className="absolute inset-x-0 top-14 h-4 sm:top-20" />
      <div className="relative z-20 w-full max-w-4xl px-4 text-center">
        <SkeletonText className="mx-auto h-10 w-48 rounded sm:h-14 sm:w-64" />
        <div className="mt-8 flex flex-wrap justify-center gap-3 sm:mt-10 sm:gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className="relative size-28 overflow-hidden rounded-lg bg-surface sm:size-32">
                <SkeletonImage className="absolute inset-0 size-full rounded-lg" />
                {i === 1 && <Skeleton className="absolute bottom-1 right-1 size-5 rounded-full" />}
              </div>
              <SkeletonText className="h-4 w-24 rounded sm:w-28" />
              {i === 0 && <Skeleton className="h-4 w-16 rounded-full" />}
            </div>
          ))}
          <div className="flex flex-col items-center gap-3">
            <div className="grid size-28 place-items-center rounded-lg border border-dashed border-border sm:size-32">
              <Skeleton className="size-8 rounded" />
            </div>
            <SkeletonText className="h-4 w-24 rounded" />
          </div>
        </div>
        <SkeletonButton className="mx-auto mt-8 h-10 w-40 rounded border sm:mt-12" />
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Search page skeleton – Navbar + search bar + results sections     */
/* ------------------------------------------------------------------ */

export function SearchPageSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <main className="px-4 pt-24 pb-16 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="relative">
            <Skeleton className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Skeleton className="w-full rounded-full border border-border bg-surface pl-12 pr-12 py-3.5 sm:py-4 text-base sm:text-lg" style={{ height: 52 }} />
          </div>
          <div className="mt-4 flex gap-2 border-b border-border overflow-x-auto">
            {["titles", "people"].map((t) => (
              <SkeletonButton key={t} size="px-4 py-2.5 sm:py-2 text-sm" className="border-b-2 -mb-px border-transparent text-muted-foreground" />
            ))}
          </div>
        </div>
        <section className="mx-auto w-full max-w-[1800px]">
          <div className="mx-auto mt-6 w-full">
            <SkeletonText className="mt-6 text-sm text-muted-foreground" />
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
              {Array.from({ length: 12 }).map((_, i) => (
                <MovieCardSkeleton key={i} fluid />
              ))}
            </div>
          </div>
          <div className="mt-6">
            <SkeletonText className="h-6 w-32 font-bold tracking-tight" />
            <div className="flex flex-wrap gap-2 mt-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonButton key={i} size="px-3 py-1.5 text-xs" className="border-border text-muted-foreground" />
              ))}
            </div>
          </div>
          <div className="mt-8 space-y-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Settings page skeleton – Navbar + settings sections               */
/* ------------------------------------------------------------------ */

export function SettingsPageSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pt-28 pb-20 sm:px-8">
        <SkeletonText className="text-3xl font-bold tracking-tight w-48" />
        <SkeletonText className="mt-1 text-sm text-muted-foreground w-64" />
        {/* Profile */}
        <section className="mt-8 rounded-lg border border-border bg-card/40 p-4 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Skeleton className="size-4" />
            <SkeletonText className="h-5 w-24" />
          </div>
          <div className="mt-5 flex flex-col sm:flex-row gap-6">
            <div className="flex flex-col items-center gap-3">
              <SkeletonAvatar className="size-24 rounded-full" />
              <div className="flex flex-wrap justify-center gap-2">
                <SkeletonButton className="h-8 w-20 rounded-md" />
                <SkeletonButton className="h-8 w-28 rounded-md" />
                <SkeletonButton className="h-8 w-16 rounded-md" />
              </div>
            </div>
            <div className="flex-1 grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={i === 4 ? "sm:col-span-2" : ""}>
                  <SkeletonText className="h-3 w-20 mb-1" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <SkeletonButton className="h-10 w-28 rounded-md" />
          </div>
        </section>
        {/* Password */}
        <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Skeleton className="size-4" />
            <SkeletonText className="h-5 w-24" />
          </div>
          <SkeletonText className="mt-1 h-3 w-56 text-xs text-muted-foreground" />
          <div className="mt-4">
            <SkeletonButton className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" />
          </div>
        </section>
        {/* Accessibility */}
        <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Skeleton className="size-4" />
            <SkeletonText className="h-5 w-28" />
          </div>
          <SkeletonText className="mt-1 h-3 w-60 text-xs text-muted-foreground" />
          <div className="mt-4 flex items-center justify-between gap-4 rounded-md border border-border bg-background/60 px-4 py-3">
            <div>
              <SkeletonText className="text-sm font-medium" />
              <SkeletonText className="mt-0.5 text-xs text-muted-foreground w-48" />
            </div>
            <Skeleton className="relative inline-flex h-6 w-11 shrink-0 rounded-full border-2" />
          </div>
        </section>
        {/* Devices */}
        <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Skeleton className="size-4" />
                <SkeletonText className="h-5 w-32" />
              </div>
              <SkeletonText className="mt-1 text-xs text-muted-foreground w-64" />
            </div>
            <SkeletonButton size="h-8 px-3 py-1.5 text-xs" />
          </div>
          <div className="mt-5 divide-y divide-border rounded-md border border-border bg-background/40">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4">
                <Skeleton className="grid size-10 shrink-0 place-items-center rounded-md bg-accent" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SkeletonText className="h-4 w-32" />
                    <Skeleton className="h-4 w-20 rounded-full" />
                  </div>
                  <SkeletonText className="mt-0.5 h-3 w-40 text-xs text-muted-foreground" />
                </div>
                <SkeletonButton className="h-8 w-20 rounded-md shrink-0" />
              </div>
            ))}
          </div>
        </section>
        {/* Interests */}
        <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Skeleton className="size-4" />
            <SkeletonText className="h-5 w-20" />
          </div>
          <SkeletonText className="mt-1 h-3 w-64 text-xs text-muted-foreground" />
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonButton key={i} size="px-3.5 py-1.5 text-sm" className="border-border text-muted-foreground" />
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <SkeletonButton className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" />
            <SkeletonText className="text-xs text-muted-foreground" />
          </div>
        </section>
        {/* Notifications */}
        <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="grid size-10 shrink-0 place-items-center rounded-md bg-accent" />
              <div>
                <SkeletonText className="text-sm font-semibold" />
                <SkeletonText className="text-xs text-muted-foreground mt-0.5" />
              </div>
            </div>
            <SkeletonButton className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground" />
          </div>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="mt-4 flex items-center justify-between gap-4 rounded-md border border-border bg-background/60 px-4 py-3">
              <div>
                <SkeletonText className="text-sm font-semibold" />
                <SkeletonText className="text-xs text-muted-foreground mt-0.5 w-64" />
              </div>
              <Skeleton className="relative inline-flex h-6 w-11 shrink-0 rounded-full border-2" />
            </div>
          ))}
        </section>
        {/* Sign out */}
        <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Skeleton className="size-4" />
                <SkeletonText className="h-5 w-24" />
              </div>
              <SkeletonText className="mt-1 text-xs text-muted-foreground w-64" />
            </div>
            <SkeletonButton className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent shrink-0" />
          </div>
        </section>
        {/* Export data */}
        <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Skeleton className="size-4" />
                <SkeletonText className="h-5 w-32" />
              </div>
              <SkeletonText className="mt-1 text-xs text-muted-foreground w-64" />
            </div>
            <SkeletonButton className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent shrink-0" />
          </div>
        </section>
        {/* Delete account */}
        <section className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <SkeletonText className="text-sm font-semibold text-destructive" />
              <SkeletonText className="mt-1 text-xs text-muted-foreground w-64" />
            </div>
            <SkeletonButton className="inline-flex items-center gap-2 rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground" />
          </div>
        </section>
        <div className="mt-8 text-center">
          <SkeletonButton className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-primary hover:text-primary-foreground" />
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Movie detail page skeleton – Navbar + hero + details + rows       */
/* ------------------------------------------------------------------ */

export function MovieDetailPageSkeleton() {
  return (
    <div className="min-h-dvh bg-background pb-20 md:pb-0">
      <Navbar />
      <section className="relative pt-16 md:flex md:min-h-[85vh] md:items-center md:pt-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[48vh] sm:h-[60vh] md:inset-y-0 md:aspect-auto md:h-auto overflow-hidden">
          <SkeletonImage className="absolute inset-0 size-full rounded-none bg-surface/60" />
        </div>
        <div className="relative z-10 w-full min-w-0 px-4 pt-[44vh] sm:pt-[52vh] pb-10 sm:pb-10 md:pt-0 md:pb-16 md:px-12 lg:px-16">
          <SkeletonButton size="h-9 w-24 rounded-full" className="mb-6" />
          <div className="grid w-full min-w-0 gap-10 md:grid-cols-3 md:items-center md:gap-8">
            <div className="min-w-0 space-y-4 md:col-span-2">
              <SkeletonText className="mb-4 h-16 w-72 max-w-full rounded-md sm:h-20 md:h-24 md:w-80" />
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-7 w-24 rounded-full sm:h-8 sm:w-28" />
                <Skeleton className="h-7 w-20 rounded-full sm:h-8 sm:w-24" />
                <Skeleton className="h-7 w-24 rounded-full sm:h-8 sm:w-28" />
                <Skeleton className="h-7 w-20 rounded-full sm:h-8 sm:w-24" />
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-20 rounded-full sm:h-8 sm:w-28" />
                ))}
              </div>
              <div className="min-w-0">
                <SkeletonText className="h-4 w-full max-w-xl rounded sm:h-5" />
                <SkeletonText className="mt-2 h-4 w-full max-w-xl rounded sm:h-5" />
                <SkeletonText className="mt-2 h-4 w-2/3 max-w-xl rounded sm:h-5" />
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2 sm:gap-3">
                <SkeletonButton className="h-10 w-28 rounded-md sm:h-12 sm:w-32" />
                <SkeletonButton className="h-10 w-28 rounded-md sm:h-12 sm:w-36" />
                <SkeletonButton className="h-10 w-28 rounded-md sm:h-12 sm:w-32" />
                <Skeleton className="size-11 rounded-full sm:size-12" />
                <Skeleton className="size-11 rounded-full sm:size-12" />
              </div>
              <div className="min-w-0 pt-4">
                <SkeletonText className="mb-3 h-5 w-16" />
                <div className="flex gap-3 overflow-hidden py-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <SkeletonImage key={i} className="w-20 shrink-0 aspect-square rounded-xl sm:w-24" />
                  ))}
                </div>
              </div>
              <div className="min-w-0 pt-4">
                <SkeletonText className="mb-3 h-5 w-16" />
                <div className="flex gap-3 overflow-hidden py-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonImage key={i} className="w-20 shrink-0 aspect-square rounded-xl sm:w-24" />
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden min-w-0 md:col-span-1 md:block">
              <SkeletonImage className="w-full max-w-80 aspect-[2/3] rounded-xl" />
            </div>
          </div>
        </div>
      </section>
      {Array.from({ length: 3 }).map((_, i) => (
        <RowSkeleton key={i} title trending={i === 0} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Person detail page skeleton – Navbar + photo + bio + credits      */
/* ------------------------------------------------------------------ */

export function PersonDetailPageSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <main className="px-4 pt-28 pb-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <SkeletonButton size="h-7 w-20 rounded" className="mb-4" />
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 mb-12">
            <SkeletonImage className="size-48 shrink-0 rounded-xl" />
            <div className="min-w-0">
              <SkeletonText className="h-10 sm:h-12 w-64 rounded font-black tracking-tight" />
              <SkeletonText className="mt-1 h-4 w-32 text-muted-foreground" />
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <SkeletonText className="h-6 w-24" />
                <SkeletonText className="h-6 w-24" />
                <SkeletonText className="h-6 w-32" />
              </div>
              <div className="mt-4">
                <SkeletonText className="h-4 w-full max-w-2xl" />
                <SkeletonText className="mt-1 h-3 w-24" />
              </div>
            </div>
          </div>
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <SkeletonText className="h-6 sm:h-8 w-32 font-bold tracking-tight" />
              <SkeletonButton className="h-8 w-28 rounded-md" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <SkeletonImage key={i} className="aspect-[2/3] w-full rounded-lg bg-surface" />
              ))}
            </div>
          </div>
          {Array.from({ length: 2 }).map((sectionIdx) => (
            <div key={sectionIdx} className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <SkeletonText className="h-6 sm:h-8 w-40 font-bold tracking-tight" />
                <SkeletonButton className="h-8 w-32 rounded-md" />
              </div>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <MovieCardSkeleton key={i} fluid landscape compact />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
