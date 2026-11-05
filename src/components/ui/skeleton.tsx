import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Base skeleton building block                                      */
/* ------------------------------------------------------------------ */

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
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

/* ------------------------------------------------------------------ */
/*  Movie card skeleton – matches MovieCard exactly                   */
/*  Portrait (default) & landscape variants, responsive breakpoints   */
/* ------------------------------------------------------------------ */

export function MovieCardSkeleton({
  landscape = false,
  fluid = false,
  compact = false,
  rank = false,
  progress = false,
}: {
  landscape?: boolean;
  fluid?: boolean;
  compact?: boolean;
  rank?: boolean;
  progress?: boolean;
} = {}) {
  const width = fluid
    ? "w-full"
    : landscape
      ? compact
        ? "w-[230px] sm:w-[300px] shrink-0"
        : "w-[280px] sm:w-[380px] shrink-0"
      : compact
        ? "w-[155px] sm:w-[195px] shrink-0"
        : "w-[175px] sm:w-[220px] shrink-0";

  return (
    <div
      className={cn(
        "group relative block shrink-0",
        width,
        "data-context=movie",
      )}
    >
      {/* Image area */}
      <div
        className={cn(
          "relative overflow-hidden rounded-xl bg-surface shadow-md transition-shadow duration-300 group-hover:shadow-2xl",
          landscape ? "aspect-video" : "aspect-[2/3]",
        )}
      >
        <Skeleton className="size-full" />
        {/* Placeholder fallback (when no poster) */}
        <div className="grid size-full place-items-center bg-card p-2 text-center text-xs text-muted-foreground" />
        {/* Bottom gradient (always on sm+, hover on md+) */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/95 via-background/40 to-transparent pointer-events-none transition-opacity duration-300",
            compact || landscape ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        />

        {/* Rating badge (top-left) */}
        <div
          className={cn(
            "absolute top-2 z-10 flex items-center gap-1 rounded bg-black/70 backdrop-blur-lg px-2 py-1 border border-yellow-400/30",
            rank ? "left-10" : "left-2",
          )}
        >
          <Skeleton className="size-3.5 fill-current text-yellow-400" />
          <Skeleton className="text-yellow-400 font-bold text-[11px] sm:text-xs h-4 w-12 rounded" />
        </div>

        {/* Watchlist button (top-right) */}
        <button
          type="button"
          className="absolute top-2 right-2 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-label="Add to My List"
        >
          <div className="flex size-8 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-sm">
            <Skeleton className="size-4 fill-current" />
          </div>
        </button>

        {/* Bottom title / meta area */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 p-3 transition-all duration-300 ease-out",
            landscape
              ? "translate-y-0 opacity-100"
              : "translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100",
          )}
        >
          {/* Title */}
          <Skeleton
            className={cn(
              "font-bold text-white line-clamp-1 drop-shadow-lg select-none",
              landscape
                ? compact
                  ? "text-sm sm:text-base"
                  : "text-lg sm:text-xl"
                : compact
                  ? "text-xs sm:text-sm"
                  : "text-xs sm:text-sm",
            )}
          />

          {/* Meta row: year · runtime / seasons */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <Skeleton
              className={cn(
                "text-muted-foreground",
                landscape
                  ? compact
                    ? "text-xs sm:text-sm"
                    : "text-base sm:text-lg"
                  : compact
                    ? "text-xs sm:text-sm"
                    : "text-[10px] sm:text-xs",
              )}
            />
            <Skeleton className="text-muted-foreground/40 h-3 w-1 rounded" />
            <Skeleton
              className={cn(
                "text-white/80",
                landscape
                  ? compact
                    ? "text-xs sm:text-sm"
                    : "text-base sm:text-lg"
                  : compact
                    ? "text-xs sm:text-sm"
                    : "text-[10px] sm:text-xs",
              )}
            />
          </div>

          {/* Reason row (Sparkles + text) */}
          <div className="mt-1 flex items-center gap-1 text-purple-300">
            <Skeleton className={landscape ? "size-4 shrink-0" : "size-3 shrink-0"} />
            <Skeleton
              className={cn(
                "line-clamp-1",
                landscape
                  ? compact
                    ? "text-xs sm:text-sm"
                    : "text-base sm:text-lg"
                  : compact
                    ? "text-xs sm:text-sm"
                    : "text-[10px] sm:text-[11px]",
              )}
            />
          </div>
        </div>

        {/* Rank badge (Top 10 style) */}
        {rank && (
          <div
            aria-hidden="true"
            className="absolute left-0 top-0 z-[5] flex flex-col items-center justify-center overflow-hidden font-bold text-white"
            style={{
              width: 30,
              height: 38,
              padding: "5px 2px 7px",
              clipPath: "polygon(0px 0px, 100% 0px, 100% 100%, 50% 85%, 0px 100%)",
              background: "var(--primary)",
              boxShadow: "0 4px 10px rgb(0 0 0 / 0.45)",
            }}
          >
            <Skeleton className="text-[9px] leading-tight uppercase tracking-wide h-3 w-6 rounded" />
            <Skeleton className="text-[11px] leading-none -mt-0.5 tabular-nums h-4 w-6 rounded" />
          </div>
        )}

        {/* Progress bar (Continue Watching) */}
        {progress && (
          <>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-foreground/20">
              <Skeleton className="h-full bg-primary w-1/2" />
            </div>
            <div className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
              <Skeleton className="h-3 w-12 rounded" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero banner skeleton – matches HeroBanner                         */
/* ------------------------------------------------------------------ */

export function HeroBannerSkeleton() {
  return (
    <section
      className="relative w-full overflow-hidden aspect-[4/5] sm:aspect-[16/9] max-h-[95vh] min-h-[60vh] sm:min-h-[50vh] sm:min-h-[400px] lg:min-h-[550px]"
    >
      {/* Background slides */}
      <div className="absolute inset-0 size-full">
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            className="absolute inset-0 size-full object-cover bg-surface/30"
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/70 to-transparent md:h-72" />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 flex h-full items-end justify-center px-4 pb-10 pt-8 text-center sm:pb-8 sm:pt-10 sm:px-8 md:items-end md:justify-start">
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-background/95 via-background/40 to-transparent z-0 pointer-events-none" />

        <div className="animate-fade-in w-full max-w-none space-y-2 sm:space-y-3 text-center md:max-w-3xl md:text-left">
          {/* Title / Logo */}
          <Skeleton className="mb-2 sm:mb-4 mx-auto md:mx-0 h-8 w-56 max-w-full rounded-md sm:h-10 sm:w-64 lg:h-12 lg:w-72" />

          {/* Genre chips */}
          <div className="mb-1.5 sm:mb-2 flex flex-wrap items-center justify-center md:justify-start gap-1.5 text-base font-normal text-white/80 tracking-wide">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>

          {/* Meta badges: score, year, rating, runtime/seasons */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-sm md:justify-start md:text-sm">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>

          {/* Description (hidden mobile, visible md+) */}
          <Skeleton className="hidden md:block mx-auto md:mx-0 h-4 w-full max-w-xl rounded lg:h-5" />
          <Skeleton className="hidden md:block mx-auto md:mx-0 h-4 w-full max-w-xl rounded lg:h-5" />
          <Skeleton className="hidden md:block mx-auto md:mx-0 h-4 w-2/3 max-w-xl rounded lg:h-5" />

          {/* Action buttons: Play + More Info */}
          <div className="mx-auto md:mx-0 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto md:justify-start px-4 sm:px-0">
            <Skeleton className="h-10 w-28 rounded-md sm:h-11 sm:w-32 lg:h-12 lg:w-36" />
            <Skeleton className="h-10 w-28 rounded-md sm:h-11 sm:w-36 lg:h-12 lg:w-40" />
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-3 inset-x-0 z-10 flex items-center justify-center gap-2 sm:justify-end sm:right-8 sm:inset-x-auto">
        <Skeleton className="w-8 h-2 rounded-full" />
        <Skeleton className="w-2 h-2 rounded-full" />
        <Skeleton className="w-2 h-2 rounded-full" />
        <Skeleton className="w-2 h-2 rounded-full" />
        <Skeleton className="w-2 h-2 rounded-full" />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Row skeleton – matches Row component                              */
/*  Section title + scroll buttons + card scroll area                 */
/* ------------------------------------------------------------------ */

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
        {/* Scroll buttons (sm+ only) */}
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

        <div
          className="scrollbar-hide flex min-w-0 gap-4 overflow-x-auto overscroll-x-contain scroll-smooth px-4 sm:gap-6 sm:px-8 pb-4 sm:pb-10"
        >
          {trending
            ? // Landscape/trending cards
              Array.from({ length: 3 }).map((_, i) => (
                <MovieCardSkeleton
                  key={`landscape-${i}`}
                  landscape
                  compact
                />
              ))
            : // Portrait cards
              Array.from({ length: 7 }).map((_, i) => (
                <MovieCardSkeleton key={i} />
              ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Continue watching skeleton                                        */
/* ------------------------------------------------------------------ */

export function ContinueWatchingSkeleton({ count = 5 }: { count?: number } = {}) {
  return (
    <section className="relative space-y-0 py-0 sm:space-y-0 sm:py-0">
      <Skeleton className="px-4 sm:px-8 mb-4 sm:mb-6 h-8 sm:h-9 w-52 rounded" />
      <div className="relative">
        <div className="scrollbar-hide flex min-w-0 gap-4 overflow-x-auto overscroll-x-contain scroll-smooth px-4 sm:gap-6 sm:px-8 pb-4 sm:pb-10">
          {Array.from({ length: count }).map((_, i) => (
            <MovieCardSkeleton key={i} progress />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  My list skeleton – matches MyListPage grid                        */
/* ------------------------------------------------------------------ */

export function MyListSkeleton({ count = 12 }: { count?: number } = {}) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} fluid />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Search results skeleton                                           */
/* ------------------------------------------------------------------ */

export function SearchResultsSkeleton({ count = 12 }: { count?: number } = {}) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} fluid />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Person card skeleton – matches PersonCard (search page)           */
/* ------------------------------------------------------------------ */

export function PersonCardSkeleton({ fluid = false }: { fluid?: boolean } = {}) {
  return (
    <div className={`flex-shrink-0 ${fluid ? "w-full" : "w-[160px] sm:w-[180px] md:w-[200px]"}`}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-surface">
        <Skeleton className="size-full" />
        <div className="flex size-full items-center justify-center text-sm font-bold text-muted-foreground" />
      </div>
      <div className="mt-2 space-y-1">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-3 w-3/4 rounded" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Season episode picker skeleton                                    */
/* ------------------------------------------------------------------ */

export function SeasonEpisodePickerSkeleton({
  episodeCount = 6,
}: { episodeCount?: number } = {}) {
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

/* ------------------------------------------------------------------ */
/*  Settings section skeleton – generic section layout                */
/* ------------------------------------------------------------------ */

export function SettingsSectionSkeleton() {
  return (
    <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6 animate-pulse">
      {/* Section header: icon + title */}
      <div className="flex items-center gap-2">
        <Skeleton className="size-4" />
        <Skeleton className="h-5 w-24 rounded" />
      </div>
      {/* Section description */}
      <Skeleton className="mt-1 h-3 w-48 rounded" />
      {/* Section content - generic form field layout */}
      <div className="mt-4 flex flex-col sm:flex-row gap-6">
        {/* Left side - avatar/profile image placeholder */}
        <div className="flex flex-col items-center gap-3 sm:w-32 shrink-0">
          <Skeleton className="size-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        {/* Right side - form fields grid */}
        <div className="flex-1 grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={i === 5 ? "sm:col-span-2" : ""}>
              <Skeleton className="h-3 w-20 mb-1 rounded" /> {/* Label */}
              <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
            </div>
          ))}
        </div>
      </div>
      {/* Save button at bottom */}
      <div className="mt-6 flex justify-end">
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Profile settings skeleton                                         */
/* ------------------------------------------------------------------ */

export function ProfileSettingsSkeleton() {
  return (
    <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6 animate-pulse">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Skeleton className="size-4" />
        <Skeleton className="h-5 w-20 rounded" />
      </div>

      {/* Avatar upload area + form fields */}
      <div className="mt-4 flex flex-col sm:flex-row gap-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 sm:w-32 shrink-0">
          <Skeleton className="size-24 rounded-full" />
          <div className="flex flex-wrap justify-center gap-2 w-full">
            <Skeleton className="h-8 w-20 rounded-md" /> {/* Upload button */}
            <Skeleton className="h-8 w-28 rounded-md" /> {/* Use Google photo */}
            <Skeleton className="h-8 w-16 rounded-md" /> {/* Remove */}
          </div>
        </div>
        {/* Form fields */}
        <div className="flex-1 grid gap-4 sm:grid-cols-2">
          {/* Email */}
          <div>
            <Skeleton className="h-3 w-12 mb-1 rounded" />
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 shrink-0" />
              <Skeleton className="h-4 w-48 flex-1 rounded" />
              <Skeleton className="h-8 w-24 rounded-md shrink-0" /> {/* Verify email button */}
            </div>
          </div>
          {/* Display name */}
          <div>
            <Skeleton className="h-3 w-24 mb-1 rounded" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-full flex-1 rounded-md" />
              <Skeleton className="h-10 w-20 rounded-md shrink-0" /> {/* Save button */}
            </div>
          </div>
          {/* Member since */}
          <div>
            <Skeleton className="h-3 w-24 mb-1 rounded" />
            <Skeleton className="h-10 w-36 rounded-md" />
          </div>
          {/* User ID */}
          <div>
            <Skeleton className="h-3 w-16 mb-1 rounded" />
            <Skeleton className="h-10 w-48 rounded-md font-mono" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Security settings skeleton                                        */
/* ------------------------------------------------------------------ */

export function SecuritySettingsSkeleton() {
  return (
    <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6 animate-pulse">
      <div className="flex items-center gap-2">
        <Skeleton className="size-4" />
        <Skeleton className="h-5 w-20 rounded" />
      </div>
      <Skeleton className="mt-1 h-3 w-56 rounded" />

      {/* Password fields */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Skeleton className="h-3 w-20 mb-1 rounded" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <div>
          <Skeleton className="h-3 w-24 mb-1 rounded" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <div className="sm:col-span-2">
          <Skeleton className="h-3 w-24 mb-1 rounded" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>

      {/* 2FA row */}
      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="mt-0.5 h-3 w-40 rounded" />
        </div>
        <Skeleton className="h-6 w-11 rounded-full border-2 shrink-0" />
      </div>

      {/* Save button */}
      <div className="mt-6 flex justify-end">
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Accessibility settings skeleton                                   */
/* ------------------------------------------------------------------ */

export function AccessibilitySettingsSkeleton() {
  return (
    <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6 animate-pulse">
      <div className="flex items-center gap-2">
        <Skeleton className="size-4" />
        <Skeleton className="h-5 w-28 rounded" />
      </div>
      <Skeleton className="mt-1 h-3 w-60 rounded" />

      {/* Reduce motion toggle */}
      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <Skeleton className="h-3 w-28 rounded" />
          <Skeleton className="mt-0.5 h-3 w-48 rounded" />
        </div>
        <Skeleton className="h-6 w-11 rounded-full border-2 shrink-0" />
      </div>

      {/* High contrast toggle */}
      <div className="mt-3 flex items-center justify-between gap-4">
        <div>
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="mt-0.5 h-3 w-48 rounded" />
        </div>
        <Skeleton className="h-6 w-11 rounded-full border-2 shrink-0" />
      </div>

      {/* Save button */}
      <div className="mt-6 flex justify-end">
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Devices settings skeleton                                         */
/* ------------------------------------------------------------------ */

export function DevicesSettingsSkeleton({ deviceCount = 3 }: { deviceCount?: number } = {}) {
  return (
    <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6 animate-pulse">
      <div className="flex items-center gap-2">
        <Skeleton className="size-4" />
        <Skeleton className="h-5 w-20 rounded" />
      </div>
      <Skeleton className="mt-1 h-3 w-56 rounded" />

      {/* Device list */}
      <div className="mt-4 space-y-3">
        {Array.from({ length: deviceCount }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4">
            <Skeleton className="size-10 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-4 w-32 rounded" />
                {i === 0 && <Skeleton className="h-4 w-20 rounded-full" />}
              </div>
              <Skeleton className="mt-0.5 h-3 w-40 rounded" />
            </div>
            <Skeleton className="h-8 w-20 rounded-md shrink-0" /> {/* Remove button */}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Device list item skeleton                                         */
/* ------------------------------------------------------------------ */

export function DeviceListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4 animate-pulse">
      <Skeleton className="size-10 shrink-0 rounded-md" /> {/* Device icon */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-4 w-32 rounded" /> {/* Device label */}
          <Skeleton className="h-4 w-20 rounded-full" /> {/* "This device" badge */}
        </div>
        <Skeleton className="mt-0.5 h-3 w-40 rounded" /> {/* IP + last active */}
      </div>
      <Skeleton className="h-8 w-20 rounded-md shrink-0" /> {/* Remove button */}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Interests settings skeleton                                       */
/* ------------------------------------------------------------------ */

export function InterestsSettingsSkeleton() {
  return (
    <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6 animate-pulse">
      <div className="flex items-center gap-2">
        <Skeleton className="size-4" />
        <Skeleton className="h-5 w-20 rounded" />
      </div>
      <Skeleton className="mt-1 h-3 w-64 rounded" />

      {/* Genre chips grid */}
      <div className="mt-4 flex flex-wrap gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>

      {/* Save button */}
      <div className="mt-6 flex justify-end">
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Notifications settings skeleton                                   */
/* ------------------------------------------------------------------ */

export function NotificationsSettingsSkeleton() {
  return (
    <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6 animate-pulse">
      <div className="flex items-center gap-2">
        <Skeleton className="size-4" />
        <Skeleton className="h-5 w-28 rounded" />
      </div>
      <Skeleton className="mt-1 h-3 w-64 rounded" />

      {/* Permission status badge */}
      <Skeleton className="mt-4 h-8 w-24 rounded-md" />

      {/* Enable Notifications button */}
      <div className="mt-4">
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>

      {/* Upcoming Movie Notifications toggle */}
      <div className="mt-4 flex items-center justify-between gap-4 rounded-md border border-border bg-background/60 px-4 py-3">
        <div>
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="mt-0.5 h-3 w-48 rounded" />
        </div>
        <Skeleton className="h-6 w-11 rounded-full border-2 shrink-0" />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Sign out settings skeleton                                        */
/* ------------------------------------------------------------------ */

export function SignOutSettingsSkeleton() {
  return (
    <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Skeleton className="size-4" />
            <Skeleton className="h-5 w-20 rounded" />
          </div>
          <Skeleton className="mt-1 h-3 w-40 rounded" />
        </div>
        <Skeleton className="h-10 w-28 rounded-md shrink-0" />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Export data settings skeleton                                     */
/* ------------------------------------------------------------------ */

export function ExportDataSettingsSkeleton() {
  return (
    <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Skeleton className="size-4" />
            <Skeleton className="h-5 w-28 rounded" />
          </div>
          <Skeleton className="mt-1 h-3 w-56 rounded" />
        </div>
        <Skeleton className="h-10 w-28 rounded-md shrink-0" />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Delete account settings skeleton                                  */
/* ------------------------------------------------------------------ */

export function DeleteAccountSettingsSkeleton() {
  return (
    <section className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:p-6 animate-pulse">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-4 w-24 rounded text-destructive" />
          <Skeleton className="mt-1 h-3 w-56 rounded" />
        </div>
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  History item skeleton – matches HistoryPage items                 */
/* ------------------------------------------------------------------ */

export function HistoryItemSkeleton() {
  return (
    <div className="space-y-3">
      {/* Movie items */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border border-border bg-surface/40 p-3 sm:p-4">
          <div className="relative shrink-0">
            <Skeleton className="h-16 w-12 rounded object-cover sm:h-20 sm:w-14" />
          </div>
          <div className="min-w-0 flex-1">
            <Skeleton className="truncate font-semibold text-sm sm:text-base" />
            <Skeleton className="text-xs text-muted-foreground mt-0.5 h-3 w-24 rounded" />
            <Skeleton className="text-xs text-muted-foreground/70 line-clamp-1 mt-1 h-3 w-32 rounded" />
            <Skeleton className="text-[10px] text-muted-foreground/50 mt-1 h-3 w-40 rounded" />
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
            <Skeleton className="h-16 w-12 rounded object-cover sm:h-20 sm:w-14" />
          </div>
          <div className="min-w-0 flex-1">
            <Skeleton className="truncate font-semibold text-sm sm:text-base" />
            <Skeleton className="text-xs text-muted-foreground mt-0.5 h-3 w-32 rounded" />
            <Skeleton className="text-xs text-muted-foreground/70 line-clamp-1 mt-1 h-3 w-40 rounded" />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button className="flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-background/80 text-muted-foreground">
              <Skeleton className="size-5 sm:size-4" />
            </button>
            <Skeleton className="size-5 sm:size-4 text-muted-foreground" />
          </div>
        </div>
        <div className="border-t border-border">
          {[1, 2, 3].map((i) => (
            <a
              key={i}
              className="flex items-center gap-3 px-4 py-2.5 sm:px-6"
            >
              <div className="shrink-0 w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                <Skeleton className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <Skeleton className="text-sm font-medium truncate h-4 w-24 rounded" />
                <Skeleton className="text-[11px] text-muted-foreground/60 h-3 w-24 rounded" />
              </div>
              <button className="shrink-0 flex items-center justify-center w-7 h-7 sm:w-6 sm:h-6 rounded-lg bg-background/80 text-muted-foreground/60">
                <Skeleton className="size-4 sm:size-3.5" />
              </button>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Profile skeleton – ProfilesPage "Who's watching?" layout          */
/* ------------------------------------------------------------------ */

export function ProfileSkeleton() {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-background">
      {/* Background slides with gradient overlay */}
      <div className="absolute inset-0">
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            className="absolute inset-0 size-full object-cover bg-surface/30"
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background" />
      </div>

      {/* Header with logo + settings */}
      <header className="absolute inset-x-0 top-0 px-4 sm:px-12 py-5 z-10 flex items-center justify-between">
        <Skeleton className="h-8 w-32 rounded" />
        <Skeleton className="size-10 rounded-lg" />
      </header>

      {/* Legal banner placeholder */}
      <Skeleton className="absolute inset-x-0 top-14 h-4 sm:top-20" />

      {/* Main content */}
      <div className="relative z-20 w-full max-w-4xl px-4 text-center">
        {/* Title: "Who's watching?" */}
        <Skeleton className="mx-auto h-10 w-48 rounded sm:h-14 sm:w-64" />

        {/* Profile grid - 3 profile cards + add button */}
        <div className="mt-8 flex flex-wrap justify-center gap-3 sm:mt-10 sm:gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              {/* Avatar circle */}
              <div className="relative size-28 overflow-hidden rounded-lg bg-surface sm:size-32">
                <Skeleton className="absolute inset-0 size-full" />
                {/* PIN lock indicator */}
                {i === 1 && (
                  <Skeleton className="absolute bottom-1 right-1 size-5 rounded-full" />
                )}
              </div>
              {/* Profile name */}
              <Skeleton className="h-4 w-24 rounded sm:w-28" />
              {/* Kids badge (on some profiles) */}
              {i === 0 && (
                <Skeleton className="h-4 w-16 rounded-full" />
              )}
            </div>
          ))}
          {/* Add Profile button */}
          <div className="flex flex-col items-center gap-3">
            <div className="grid size-28 place-items-center rounded-lg border border-dashed border-border sm:size-32">
              <Skeleton className="size-8 rounded" />
            </div>
            <Skeleton className="h-4 w-24 rounded" />
          </div>
        </div>

        {/* Manage Profiles button */}
        <Skeleton className="mx-auto mt-8 h-10 w-40 rounded border sm:mt-12" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Browse page skeleton – hero + continue watching + rows            */
/* ------------------------------------------------------------------ */

export function BrowseSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <HeroBannerSkeleton />
      <div className="relative z-10 space-y-6 md:mt-12 md:space-y-12">
        <ContinueWatchingSkeleton count={5} />
        {[1, 2, 3, 4, 5].map((i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Explore page skeleton – hero + genre chips + rows                 */
/*  Matches explore/index.tsx exactly: hero label/title/description,  */
/*  chip row with Show all/Show less, and 5 Row carousels             */
/* ------------------------------------------------------------------ */

export function ExploreSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      {/* Hero section – matches explore hero layout */}
      <section className="relative flex h-[38vh] items-end overflow-hidden sm:h-[46vh]">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-700/50 via-surface to-background" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="relative z-10 w-full px-4 pb-8 sm:px-8 md:px-16">
          <div className="flex items-center gap-2 text-purple-300">
            <Skeleton className="size-5 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
          <Skeleton className="mt-1 h-10 sm:h-14 w-3/4 max-w-[400px] rounded sm:max-w-[600px]" />
          <Skeleton className="mt-2 h-4 sm:h-5 w-1/2 max-w-xl rounded" />
        </div>
      </section>

      <main className="mx-auto max-w-[1800px] px-4 pb-16 md:pb-20 sm:px-8">
        {/* Genre chip row – matches flex-wrap/flex-nowrap toggle + Show all/Show less */}
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

        {/* 5 slideshow rows */}
        <div className="mt-10 space-y-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <RowSkeleton key={i} title trending={false} />
          ))}
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Explore genre page skeleton – cinematic hero + chips + grid       */
/*  Matches explore/$genreId.tsx exactly: hero label/title/description, */
/*  mood chip row with Show all/Show less, movie grid, pagination,    */
/*  and empty state                                                   */
/* ------------------------------------------------------------------ */

export function ExploreGenreSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      {/* Cinematic hero */}
      <section className="relative flex h-[42vh] items-end overflow-hidden sm:h-[52vh]">
        <Skeleton className="absolute inset-0 size-full rounded-none bg-surface/60 animate-ken-burns" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="relative z-10 w-full px-4 pb-8 sm:px-8 md:px-16">
          <div className="flex items-center gap-2 text-emerald-400">
            <Skeleton className="size-5 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <Skeleton className="mt-1 h-10 sm:h-14 w-3/4 max-w-[400px] rounded sm:max-w-[600px]" />
          <Skeleton className="mt-2 h-4 sm:h-5 w-1/2 max-w-xl rounded" />
        </div>
      </section>

      <main className="mx-auto max-w-[1800px] px-4 pb-16 md:pb-20 sm:px-8">
        {/* Mood chip row – matches flex-wrap/flex-nowrap toggle + Show all/Show less */}
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

        {/* Movie grid – matches grid-cols-2 sm:3 md:4 lg:5 xl:6 2xl:7 */}
        <div className="mt-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton
                key={i}
                className="w-full text-left block"
              >
                <MovieCardSkeleton key={`card-${i}`} fluid />
              </Skeleton>
            ))}
          </div>

          {/* Pagination – Previous / page numbers / Next */}
          <div className="mt-8 flex items-center justify-center gap-2">
            <Skeleton
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground h-9 rounded"
            />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton
                key={i}
                className="rounded-md px-3 py-2 text-sm transition border border-border text-muted-foreground hover:text-foreground h-9 rounded"
              />
            ))}
            <Skeleton
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground h-9 rounded"
            />
          </div>
        </div>

        {/* Empty state – "No titles found." */}
        <Skeleton className="mt-12 h-4 w-32 text-center text-sm text-muted-foreground rounded" />
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Explore genre chips skeleton – matches chip links with Sparkles   */
/*  icon + genre name text, plus Show all / Show less buttons         */
/* ------------------------------------------------------------------ */

export function ExploreGenreChipsSkeleton({
  count = 12,
  className,
}: { count?: number; className?: string } = {}) {
  return (
    <div className={cn("mt-8 flex flex-wrap gap-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground h-9 rounded"
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Calendar skeleton – matches CalendarPage                          */
/* ------------------------------------------------------------------ */

export function CalendarSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-6xl px-4 pt-24 pb-16 sm:px-8">
        {/* Header */}
        <div className="flex items-center gap-2 text-primary">
          <Skeleton className="size-6 rounded" />
          <Skeleton className="h-5 w-32 rounded" />
        </div>
        <Skeleton className="mt-1 h-6 sm:h-8 font-bold tracking-tight w-48 rounded" />
        <Skeleton className="mt-2 h-4 w-32 text-muted-foreground rounded" />

        {/* Month navigation */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="order-1 inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary h-9 rounded" />
          <Skeleton className="order-2 flex-1 h-8 rounded w-48" />
          <div className="order-3 flex items-center gap-2">
            <Skeleton className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground h-9" />
            <Skeleton className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground h-9" />
          </div>
        </div>

        {/* Calendar grid (desktop) */}
        <div className="mt-6 hidden rounded-lg border border-border bg-card/40 p-3 sm:p-5 lg:block">
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full rounded text-center" />
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

        {/* Footer count */}
        <Skeleton className="mt-4 h-3 w-48 text-xs text-muted-foreground rounded" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Movie detail page skeleton – matches MoviePage                    */
/* ------------------------------------------------------------------ */

export function MovieDetailSkeleton() {
  return (
    <div className="min-h-dvh bg-background pb-20 md:pb-0">
      <section className="relative pt-16 md:flex md:min-h-[85vh] md:items-center md:pt-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[48vh] sm:h-[60vh] md:inset-y-0 md:aspect-auto md:h-auto overflow-hidden">
          <Skeleton className="absolute inset-0 size-full rounded-none bg-surface/60" />
        </div>

        <div className="relative z-10 w-full min-w-0 px-4 pt-[44vh] sm:pt-[52vh] pb-10 sm:pb-10 md:pt-0 md:pb-16 md:px-12 lg:px-16">
          {/* Back button */}
          <Skeleton className="mb-6 h-9 w-24 rounded-full" />

          <div className="grid w-full min-w-0 gap-10 md:grid-cols-3 md:items-center md:gap-8">
            <div className="min-w-0 space-y-4 md:col-span-2">
              {/* Title / Logo */}
              <Skeleton className="mb-4 h-16 w-72 max-w-full rounded-md sm:h-20 md:h-24 md:w-80" />

              {/* Meta badges: score, year, rating, runtime */}
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-7 w-24 rounded-full sm:h-8 sm:w-28" />
                <Skeleton className="h-7 w-20 rounded-full sm:h-8 sm:w-24" />
                <Skeleton className="h-7 w-24 rounded-full sm:h-8 sm:w-28" />
                <Skeleton className="h-7 w-20 rounded-full sm:h-8 sm:w-24" />
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-20 rounded-full sm:h-8 sm:w-28" />
                ))}
              </div>

              {/* Description */}
              <div className="min-w-0">
                <Skeleton className="h-4 w-full max-w-xl rounded sm:h-5" />
                <Skeleton className="mt-2 h-4 w-full max-w-xl rounded sm:h-5" />
                <Skeleton className="mt-2 h-4 w-2/3 max-w-xl rounded sm:h-5" />
              </div>

              {/* Action buttons: Play, Trailer, Watched, My List, Share */}
              <div className="flex flex-wrap items-center gap-2 pt-2 sm:gap-3">
                <Skeleton className="h-10 w-28 rounded-md sm:h-12 sm:w-32" />
                <Skeleton className="h-10 w-28 rounded-md sm:h-12 sm:w-36" />
                <Skeleton className="h-10 w-28 rounded-md sm:h-12 sm:w-32" />
                <Skeleton className="size-11 rounded-full sm:size-12" />
                <Skeleton className="size-11 rounded-full sm:size-12" />
              </div>

              {/* Cast section */}
              <div className="min-w-0 pt-4">
                <Skeleton className="mb-3 h-5 w-16 rounded" />
                <div className="flex gap-3 overflow-hidden py-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="w-20 shrink-0 aspect-square rounded-xl sm:w-24"
                    />
                  ))}
                </div>
              </div>

              {/* Crew section */}
              <div className="min-w-0 pt-4">
                <Skeleton className="mb-3 h-5 w-16 rounded" />
                <div className="flex gap-3 overflow-hidden py-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="w-20 shrink-0 aspect-square rounded-xl sm:w-24"
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="hidden min-w-0 md:col-span-1 md:block">
              <Skeleton className="w-full max-w-80 aspect-[2/3] rounded-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Similar / More rows */}
      {Array.from({ length: 3 }).map((_, i) => (
        <RowSkeleton key={i} title trending={i === 0} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Person detail page skeleton                                       */
/* ------------------------------------------------------------------ */

export function PersonDetailSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-6xl px-4 pt-28 pb-16 sm:px-8">
        {/* Back button */}
        <Skeleton className="mb-4 h-7 w-20 rounded" />

        <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 mb-12">
          {/* Photo */}
          <Skeleton className="size-48 shrink-0 rounded-xl" />

          <div className="min-w-0">
            <Skeleton className="h-10 sm:h-12 w-64 rounded font-black tracking-tight" />
            <Skeleton className="mt-1 h-4 w-32 text-muted-foreground rounded" />
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <Skeleton className="h-6 w-24 rounded" />
              <Skeleton className="h-6 w-24 rounded" />
              <Skeleton className="h-6 w-32 rounded" />
            </div>
            {/* Bio */}
            <div className="mt-4">
              <Skeleton className="h-4 w-full max-w-2xl rounded" />
              <Skeleton className="mt-1 h-3 w-24 rounded" />
            </div>
          </div>
        </div>

        {/* Images section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-6 sm:h-8 w-32 font-bold tracking-tight" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] w-full rounded-lg bg-surface" />
            ))}
          </div>
        </div>

        {/* Credits sections */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-6 sm:h-8 w-40 font-bold tracking-tight" />
            <Skeleton className="h-8 w-32 rounded-md" />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <MovieCardSkeleton key={i} fluid landscape compact />
            ))}
          </div>
        </div>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-6 sm:h-8 w-40 font-bold tracking-tight" />
            <Skeleton className="h-8 w-32 rounded-md" />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <MovieCardSkeleton key={i} fluid landscape compact />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Watch page skeleton – matches PlayerPage video player             */
/* ------------------------------------------------------------------ */

export function WatchSkeleton() {
  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-black select-none">
      {/* Video area */}
      <div className="size-full">
        <Skeleton className="size-full bg-surface/40" />
        {/* Poster placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="size-32 rounded-xl bg-surface/20" />
        </div>
        {/* Loading spinner */}
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <Skeleton className="size-10 animate-spin" />
        </div>
      </div>

      {/* Top controls overlay */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black via-black/60 to-transparent pt-4 px-2 sm:px-6 opacity-100"
      >
        <div className="pointer-events-auto flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="group/topbtn rounded-lg transition-colors hover:bg-white/10 -ml-1 sm:-ml-2 px-1 sm:px-2 py-2 sm:py-1">
              <button
                type="button"
                className="inline-flex items-center gap-1 sm:gap-2 text-white/90 hover:text-white min-h-10"
              >
                <Skeleton className="size-6 sm:size-6" />
                <Skeleton className="text-sm sm:text-base font-semibold drop-shadow-md h-5 w-24 rounded" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Picture in Picture"
                className="hover:text-white/70 transition min-h-11 min-w-11 flex items-center justify-center"
              >
                <Skeleton className="size-5 sm:size-5" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  aria-label="Settings"
                  className="hover:text-white/70 transition min-h-11 min-w-11 flex items-center justify-center"
                >
                  <Skeleton className="size-6 sm:size-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom progress / controls */}
      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black via-black/60 to-transparent pb-4 px-2 sm:px-6 opacity-100">
        <div className="flex flex-col gap-2">
          {/* Progress bar */}
          <div className="h-1 w-full bg-foreground/20 rounded-full">
            <Skeleton className="h-full bg-primary w-1/3 rounded-full" />
          </div>
          {/* Time labels */}
          <div className="flex justify-between text-xs text-white/60">
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-4 w-12 rounded" />
          </div>
          {/* Controls row */}
          <div className="flex items-center justify-between gap-2">
            <button className="flex items-center justify-center size-10 rounded-full bg-white/10 text-white hover:bg-white/20">
              <Skeleton className="size-5" />
            </button>
            <button className="flex items-center justify-center size-10 rounded-full bg-white/10 text-white hover:bg-white/20">
              <Skeleton className="size-5" />
            </button>
            <button className="flex items-center justify-center size-10 rounded-full bg-white/10 text-white hover:bg-white/20">
              <Skeleton className="size-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Post-play overlay (ended state) */}
      <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70">
        <div className="flex flex-col items-center gap-4 text-center">
          <Skeleton className="h-5 w-32 text-white/70 rounded" />
          <Skeleton className="h-6 w-32 font-bold text-white rounded" />
          <div className="flex items-center gap-3">
            <button className="rounded bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground">
              <Skeleton className="h-8 w-24 rounded-md" />
            </button>
            <button className="rounded bg-white px-6 py-2 text-sm font-semibold text-black">
              <Skeleton className="h-8 w-24 rounded-md" />
            </button>
            <button className="rounded bg-white/10 px-6 py-2 text-sm font-semibold text-white">
              <Skeleton className="h-8 w-24 rounded-md" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Skeleton };