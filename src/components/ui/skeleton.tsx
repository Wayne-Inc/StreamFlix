import { cn } from "@/lib/utils";
import { Navbar } from "@/components/streamflix/Navbar";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-md bg-gradient-to-r from-primary/[0.06] via-primary/[0.18] to-primary/[0.06] bg-[length:800px_100%]",
        className,
      )}
      {...props}
    />
  );
}

export function MovieCardSkeleton({ landscape = false }: { landscape?: boolean }) {
  return (
    <div className={`group relative ${landscape ? "w-[280px] sm:w-[380px] shrink-0" : "w-[175px] sm:w-[220px] shrink-0"}`}>
      <div className={`relative ${landscape ? "aspect-video" : "aspect-[2/3]"} overflow-hidden rounded-xl bg-surface`}>
        <Skeleton className="size-full" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-black/70 backdrop-blur-lg px-2 py-1 border border-yellow-400/30">
          <Skeleton className="size-3.5 rounded-full" />
          <Skeleton className="h-3 w-8 rounded" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-3">
          <Skeleton className="h-4 w-3/4 rounded mb-2" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-3 w-12 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroBannerSkeleton() {
  return (
    <section className="relative min-h-[40vh] h-[50vh] w-full overflow-hidden sm:min-h-[400px] sm:h-[65vh] lg:min-h-[550px] lg:h-[85vh]">
      <Skeleton className="absolute inset-0 size-full rounded-none bg-surface/60" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/70 to-transparent md:h-72" />
      <div className="relative z-10 flex h-full items-end justify-center px-4 pb-8 pt-10 text-center sm:px-8 md:items-end md:justify-start">
        <div className="animate-fade-in w-full max-w-none space-y-3 text-center md:max-w-3xl md:text-left">
          <Skeleton className="mb-4 mx-auto md:mx-0 h-20 w-64 max-w-full rounded-md sm:h-24 sm:w-72" />
          <div className="mb-2 flex flex-wrap items-center justify-center md:justify-start gap-1.5">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-28 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-4 w-full max-w-xl rounded" />
          <Skeleton className="h-4 w-full max-w-xl rounded" />
          <Skeleton className="h-4 w-2/3 max-w-xl rounded" />
          <div className="mx-auto md:mx-0 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto md:justify-start px-4 sm:px-0">
            <Skeleton className="h-10 w-28 rounded-md sm:h-12 sm:w-32" />
            <Skeleton className="h-10 w-28 rounded-md sm:h-12 sm:w-36" />
          </div>
        </div>
      </div>
      <div className="absolute bottom-6 inset-x-0 z-10 flex items-center justify-center gap-2 sm:justify-end sm:right-8 sm:inset-x-auto">
        <Skeleton className="w-8 h-2 rounded-full" />
        <Skeleton className="w-2 h-2 rounded-full" />
        <Skeleton className="w-2 h-2 rounded-full" />
        <Skeleton className="w-2 h-2 rounded-full" />
        <Skeleton className="w-2 h-2 rounded-full" />
      </div>
    </section>
  );
}

export function SeasonEpisodePickerSkeleton({ episodeCount = 6 }: { episodeCount?: number }) {
  return (
    <div>
      <Skeleton className="mb-2 h-3 w-20 rounded" />
      <div className="flex flex-wrap gap-1.5 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-7 w-8 rounded-md" />
        ))}
      </div>
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-7 w-24 rounded-md" />
      </div>
      <div className="space-y-1.5">
        {Array.from({ length: episodeCount }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-md" />
        ))}
      </div>
    </div>
  );
}

export function SettingsSectionSkeleton() {
  return (
    <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6">
      <Skeleton className="h-5 w-32 rounded mb-4" />
      <Skeleton className="h-3 w-64 rounded" />
      <div className="mt-5 flex flex-col sm:flex-row gap-6">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="size-24 rounded-full" />
          <Skeleton className="h-5 w-32 rounded" />
        </div>
        <div className="flex-1 grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={i === 4 ? "sm:col-span-2" : ""}>
              <Skeleton className="h-3 w-20 mb-1 rounded" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HistoryItemSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 pt-28 pb-20 sm:px-8">
        <Skeleton className="h-8 w-48 rounded mb-2" />
        <Skeleton className="h-4 w-80 rounded" />
        <section className="mt-8 rounded-lg border border-border bg-card/40 p-4 sm:p-6">
          <Skeleton className="h-4 w-20 rounded mb-5" />
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="size-24 rounded-full" />
              <Skeleton className="h-5 w-32 rounded" />
              <div className="flex flex-wrap justify-center gap-2">
                <Skeleton className="h-8 w-24 rounded-md" />
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-8 w-16 rounded-md" />
              </div>
            </div>
            <div className="flex-1 grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={i === 4 ? "sm:col-span-2" : ""}>
                  <Skeleton className="h-3 w-20 mb-1 rounded" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </section>
        <Skeleton className="mt-6 h-20 rounded-lg" />
        <Skeleton className="mt-4 h-20 rounded-lg" />
        <Skeleton className="mt-4 h-20 rounded-lg" />
        <Skeleton className="mt-4 h-20 rounded-lg" />
      </div>
    </div>
  );
}

export function ContinueWatchingSkeleton({ count = 5 }: { count?: number }) {
  return (
    <section className="relative space-y-0 py-0 sm:space-y-0 sm:py-0">
      <Skeleton className="px-4 sm:px-8 mb-4 sm:mb-6 h-8 sm:h-9 w-52 rounded" />
      <div className="relative">
        <div className="scrollbar-thin flex min-w-0 gap-4 overflow-x-auto overscroll-x-contain scroll-smooth px-4 sm:gap-6 sm:px-8 pb-4 sm:pb-10">
          {Array.from({ length: count }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function MyListSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 pt-24 pb-16 sm:px-8">
        <Skeleton className="h-10 w-72 rounded" />
        <Skeleton className="mt-2 h-4 w-52 rounded" />
        <div className="mt-8 rounded-lg bg-surface/40 p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <Skeleton key={d} className="h-6 w-full rounded text-center" />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 42 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded bg-surface/60" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { Skeleton };
