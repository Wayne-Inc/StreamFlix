import { MovieCardSkeleton, Skeleton } from "@/components/ui/skeleton";

export function RowSkeleton({
  title = true,
  trending = false,
}: { title?: boolean; trending?: boolean } = {}) {
  return (
    <section className="relative space-y-0 py-0 sm:space-y-0 sm:py-0">
      {title && (
        <h2 className="px-4 sm:px-8 mb-4 sm:mb-6 text-3xl sm:text-4xl font-bold tracking-tight">
          <Skeleton className="h-8 sm:h-9 w-52 rounded" />
        </h2>
      )}

      <div className="relative">
        {/* Scroll buttons (sm only, matching Row) */}
        <button
          type="button"
          aria-label="Scroll back"
          className="absolute left-1 sm:left-2 top-1/2 z-30 hidden sm:grid size-10 -translate-y-1/2 place-items-center rounded-md border border-border bg-background/90 text-foreground shadow-lg backdrop-blur transition hover:bg-primary hover:text-primary-foreground"
        >
          <Skeleton className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Scroll forward"
          className="absolute right-1 sm:right-2 top-1/2 z-30 hidden sm:grid size-10 -translate-y-1/2 place-items-center rounded-md border border-border bg-background/90 text-foreground shadow-lg backdrop-blur transition hover:bg-primary hover:text-primary-foreground"
        >
          <Skeleton className="size-5" />
        </button>

        <div className="scrollbar-hide flex min-w-0 gap-4 overflow-x-auto overscroll-x-contain scroll-smooth px-4 sm:gap-6 sm:px-8 pb-4 sm:pb-10">
          {trending
            ? // Landscape/trending cards (matching Row landscape widths)
              Array.from({ length: 3 }).map((_, i) => (
                <MovieCardSkeleton
                  key={`landscape-${i}`}
                  landscape
                  compact
                />
              ))
            : // Portrait cards (matching Row portrait widths)
              Array.from({ length: 7 }).map((_, i) => (
                <MovieCardSkeleton key={i} />
              ))}
        </div>
      </div>
    </section>
  );
}
