import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Base skeleton building block                                      */
/* ------------------------------------------------------------------ */

export type SkeletonVariant = "shimmer" | "pulse" | "static";

export type SkeletonRadius = "none" | "sm" | "md" | "lg" | "xl" | "full";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  radius?: SkeletonRadius;
  animate?: boolean;
  width?: string;
  height?: string;
  minWidth?: string;
  minHeight?: string;
  maxWidth?: string;
  maxHeight?: string;
}

const radiusClasses: Record<SkeletonRadius, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

/**
 * Base skeleton primitive. Renders a single placeholder box.
 *
 * - `variant="shimmer"` (default): gradient shimmer across a surface base.
 * - `variant="pulse"`: subtle opacity pulse.
 * - `variant="static"`: solid surface, no animation.
 *
 * All dimensions map to inline-friendly Tailwind-ish values so callers can
 * match real component sizes without arbitrary magic numbers.
 */
export function Skeleton({
  className,
  variant = "shimmer",
  radius = "md",
  animate = true,
  width,
  height,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  ...props
}: SkeletonProps) {
  const base = cn(
    "flex-shrink-0",
    radiusClasses[radius],
    width && `w-[${width}]`,
    height && `h-[${height}]`,
    minWidth && `min-w-[${minWidth}]`,
    minHeight && `min-h-[${minHeight}]`,
    maxWidth && `max-w-[${maxWidth}]`,
    maxHeight && `max-h-[${maxHeight}]`,
  );

  let background: string;
  if (variant === "static") {
    background = "bg-surface";
  } else if (variant === "pulse") {
    background = "bg-surface animate-skeleton-pulse";
  } else {
    // shimmer — default, subtle gradient over surface
    background =
      "bg-gradient-to-r from-surface via-surface/70 to-surface bg-[length:200%_100%] animate-skeleton-shimmer";
  }

  if (!animate) {
    background = background.replace(" animate-skeleton-shimmer", "").replace(" animate-skeleton-pulse", "");
  }

  return (
    <div className={cn(base, background, className)} {...props} />
  );
}

/* ------------------------------------------------------------------ */
/*  Convenience primitives                                            */
/* ------------------------------------------------------------------ */

/** Single line of text, e.g. a title, label, or meta line. */
export function SkeletonText({
  className,
  width = "w-full",
  height = "h-4",
  radius = "md",
  ...props
}: { className?: string; width?: string; height?: string; radius?: SkeletonRadius } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton
      className={cn(width, height, className)}
      radius={radius}
      {...props}
    />
  );
}

/** Avatar / profile picture placeholder (circle). */
export function SkeletonAvatar({
  className,
  size = "size-24",
  ...props
}: { className?: string; size?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton className={cn(size, className)} radius="full" {...props} />
  );
}

/** Image placeholder with an explicit aspect ratio. */
export function SkeletonImage({
  className,
  aspect = "aspect-[2/3]",
  width = "w-full",
  ...props
}: { className?: string; aspect?: string; width?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton className={cn(aspect, width, className)} radius="xl" {...props} />
  );
}

/** Button placeholder. */
export function SkeletonButton({
  className,
  size = "h-10 w-28",
  ...props
}: { className?: string; size?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton className={cn(size, className)} radius="md" {...props} />
  );
}

/* ------------------------------------------------------------------ */
/*  Composite primitives                                                */
/* ------------------------------------------------------------------ */

/** A card-shaped placeholder (surface card with optional image + text). */
export function SkeletonCard({
  className,
  image = true,
  imageAspect = "aspect-[2/3]",
  title = true,
  meta = true,
  titleWidth = "w-full",
  metaWidth = "w-3/4",
  ...props
}: {
  className?: string;
  image?: boolean;
  imageAspect?: string;
  title?: boolean;
  meta?: boolean;
  titleWidth?: string;
  metaWidth?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton className={cn("overflow-hidden", className)} radius="xl" {...props}>
      {image && <SkeletonImage aspect={imageAspect} className="size-full" />}
      <div className="p-3">
        {title && <SkeletonText width={titleWidth} className="mt-3" />}
        {meta && <SkeletonText width={metaWidth} height="h-3" className="mt-1" />}
      </div>
    </Skeleton>
  );
}

/** A vertical list of repeated text lines. */
export function SkeletonList({
  className,
  count = 3,
  itemHeight = "h-4",
  itemWidth = "w-full",
  gap = "space-y-2",
  ...props
}: {
  className?: string;
  count?: number;
  itemHeight?: string;
  itemWidth?: string;
  gap?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(gap, className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonText key={i} width={itemWidth} height={itemHeight} />
      ))}
    </div>
  );
}

/** A grid of repeated cells (portrait cards by default). */
export function SkeletonGrid({
  className,
  count = 6,
  cols = "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7",
  gap = "gap-3",
  cellAspect = "aspect-[2/3]",
  ...props
}: {
  className?: string;
  count?: number;
  cols?: string;
  gap?: string;
  cellAspect?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(cols, gap, className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonImage key={i} aspect={cellAspect} className="size-full" />
      ))}
    </div>
  );
}

/** Header placeholder: avatar + title line. */
export function SkeletonHeader({
  className,
  avatar = true,
  title = true,
  ...props
}: { className?: string; avatar?: boolean; title?: boolean } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton className={cn("flex items-center gap-3", className)} {...props}>
      {avatar && <SkeletonAvatar className="shrink-0" size="size-10" />}
      {title && <SkeletonText width="w-40" />}
    </Skeleton>
  );
}

/* ------------------------------------------------------------------ */
/*  Movie card placeholder – matches MovieCard exactly                */
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
    <div className={cn("group relative block shrink-0", width, "data-context=movie")}>
      {/* Image area */}
      <div
        className={cn(
          "relative overflow-hidden rounded-xl bg-surface shadow-md transition-shadow duration-300 group-hover:shadow-2xl",
          landscape ? "aspect-video" : "aspect-[2/3]",
        )}
      >
        <Skeleton className="size-full" />
        <div className="grid size-full place-items-center bg-card p-2 text-center text-xs text-muted-foreground" />
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/95 via-background/40 to-transparent pointer-events-none transition-opacity duration-300",
            compact || landscape ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        />
        {/* Rating badge */}
        <div
          className={cn(
            "absolute top-2 z-10 flex items-center gap-1 rounded bg-black/70 backdrop-blur-lg px-2 py-1 border border-yellow-400/30",
            rank ? "left-10" : "left-2",
          )}
        >
          <Skeleton className="size-3.5 fill-current text-yellow-400" />
          <Skeleton className="text-yellow-400 font-bold text-[11px] sm:text-xs h-4 w-12 rounded" />
        </div>
        {/* Watchlist button */}
        <button type="button" className="absolute top-2 right-2 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-label="Add to My List">
          <div className="flex size-8 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-sm">
            <Skeleton className="size-4 fill-current" />
          </div>
        </button>
        {/* Bottom title / meta area */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 p-3 transition-all duration-300 ease-out",
            landscape ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100",
          )}
        >
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
        {rank && (
          <div aria-hidden="true" className="absolute left-0 top-0 z-[5] flex flex-col items-center justify-center overflow-hidden font-bold text-white" style={{ width: 30, height: 38, padding: "5px 2px 7px", clipPath: "polygon(0px 0px, 100% 0px, 100% 100%, 50% 85%, 0px 100%)", background: "var(--primary)", boxShadow: "0 4px 10px rgb(0 0 0 / 0.45)" }}>
            <Skeleton className="text-[9px] leading-tight uppercase tracking-wide h-3 w-6 rounded" />
            <Skeleton className="text-[11px] leading-none -mt-0.5 tabular-nums h-4 w-6 rounded" />
          </div>
        )}
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
/*  Row placeholder – section title + scroll buttons + card scroll    */
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
        <button type="button" aria-label="Scroll back" className="absolute left-1 sm:left-2 top-1/2 z-30 hidden sm:grid size-10 -translate-y-1/2 place-items-center rounded-md border border-border bg-background/90 text-foreground shadow-lg backdrop-blur transition hover:bg-primary hover:text-primary-foreground">
          <Skeleton className="size-5" />
        </button>
        <button type="button" aria-label="Scroll forward" className="absolute right-1 sm:right-2 top-1/2 z-30 hidden sm:grid size-10 -translate-y-1/2 place-items-center rounded-md border border-border bg-background/90 text-foreground shadow-lg backdrop-blur transition hover:bg-primary hover:text-primary-foreground">
          <Skeleton className="size-5" />
        </button>
        <div className="scrollbar-hide flex min-w-0 gap-4 overflow-x-auto overscroll-x-contain scroll-smooth px-4 sm:gap-6 sm:px-8 pb-4 sm:pb-10">
          {trending
            ? Array.from({ length: 3 }).map((_, i) => (
                <MovieCardSkeleton key={`landscape-${i}`} landscape compact />
              ))
            : Array.from({ length: 7 }).map((_, i) => (
                <MovieCardSkeleton key={i} />
              ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Continue watching placeholder                                     */
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
/*  Person card placeholder – matches PersonCard                      */
/* ------------------------------------------------------------------ */

export function PersonCardSkeleton({ fluid = false }: { fluid?: boolean } = {}) {
  return (
    <div className={`flex-shrink-0 ${fluid ? "w-full" : "w-[160px] sm:w-[180px] md:w-[200px]"}`}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-surface">
        <SkeletonImage className="size-full" />
        <div className="flex size-full items-center justify-center text-sm font-bold text-muted-foreground" />
      </div>
      <div className="mt-2 space-y-1">
        <SkeletonText className="h-4 w-full" />
        <SkeletonText className="h-3 w-3/4" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Season / episode picker placeholder                               */
/* ------------------------------------------------------------------ */

export function SeasonEpisodePickerSkeleton({
  episodeCount = 6,
}: { episodeCount?: number } = {}) {
  return (
    <div>
      <SkeletonText className="mb-2 h-3 w-20" />
      <div className="flex flex-wrap gap-1.5 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-7 w-8 rounded-md" />
        ))}
      </div>
      <div className="flex items-center justify-between mb-2">
        <SkeletonText className="h-3 w-24" />
        <SkeletonImage className="h-7 w-24 rounded-md" />
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
/*  Hero banner (slideshow) details placeholder                         */
/*  Mirrors the HeroBanner details area (logo/title, genre chips,     */
/*  badges, description, play/more-info buttons, slide nav dots) so   */
/*  the slideshow never collapses to nothing while its slides load.   */
/* ------------------------------------------------------------------ */

export function HeroBannerDetailsSkeleton() {
  return (
    <section
      className="relative w-full overflow-hidden aspect-[4/5] sm:aspect-[16/9] max-h-[95vh] min-h-[60vh] sm:min-h-[50vh] sm:min-h-[400px] lg:min-h-[550px]"
    >
      {/* Backdrop placeholder + gradient overlays matching HeroBanner */}
      <div className="absolute inset-0 size-full">
        <SkeletonImage className="size-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/70 to-transparent md:h-72" />
      </div>

      <div className="relative z-10 flex h-full items-end justify-center px-4 pb-10 pt-8 text-center sm:pb-8 sm:pt-10 sm:px-8 md:items-end md:justify-start">
        {/* Bottom gradient for text contrast */}
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-background/95 via-background/40 to-transparent z-0 pointer-events-none" />

        <div className="animate-fade-in w-full max-w-none space-y-2 sm:space-y-3 text-center md:max-w-3xl md:text-left">
          {/* Title logo / title placeholder */}
          <div className="mb-2 sm:mb-4 mx-auto md:mx-0 max-h-20 w-auto max-w-full object-contain select-none sm:max-h-32 md:max-h-36">
            <SkeletonImage className="size-full" aspect="none" />
          </div>

          {/* Genre chips */}
          <div className="mb-1.5 sm:mb-2 flex flex-wrap items-center justify-center md:justify-start gap-1.5 text-base font-normal text-white/80 tracking-wide">
            <span className="flex items-center gap-1.5">
              <Skeleton className="h-5 w-16 rounded-full" />
            </span>
            <span className="flex items-center gap-1.5 text-white/40">·</span>
            <span className="flex items-center gap-1.5">
              <Skeleton className="h-5 w-20 rounded-full" />
            </span>
            <span className="flex items-center gap-1.5 text-white/40">·</span>
            <span className="flex items-center gap-1.5">
              <Skeleton className="h-5 w-24 rounded-full" />
            </span>
          </div>

          {/* Score, year, age rating, seasons/runtime badges */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-sm md:justify-start md:text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-sm font-semibold text-emerald-400 backdrop-blur-lg">
              <Skeleton className="size-3.5 fill-current text-emerald-400" />
              <Skeleton className="h-4 w-12 rounded-full" />
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white/90 backdrop-blur-lg">
              <Skeleton className="size-3.5" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white/90 backdrop-blur-lg">
              <Skeleton className="h-4 w-20 rounded-full" />
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white/90 backdrop-blur-lg">
              <Skeleton className="size-3.5" />
              <Skeleton className="h-4 w-24 rounded-full" />
            </span>
          </div>

          {/* Description */}
          <p className="hidden md:block mx-auto md:mx-0 text-lg lg:text-xl text-gray-200 leading-relaxed max-w-xl">
            <SkeletonText className="h-6 w-3/4 max-w-full rounded" />
          </p>

          {/* Play and More Info buttons */}
          <div className="mx-auto md:mx-0 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto md:justify-start px-4 sm:px-0">
            <SkeletonButton className="inline-flex w-full sm:w-auto max-w-[90%] sm:max-w-none items-center justify-center gap-2 rounded-md bg-foreground/80 backdrop-blur-xl px-6 py-3 sm:px-8 sm:py-3.5 text-base font-bold text-background transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 hover:bg-foreground/95" />
            <SkeletonButton className="inline-flex w-full sm:w-auto max-w-[90%] sm:max-w-none items-center justify-center gap-2 whitespace-nowrap border border-white/30 text-white font-bold px-6 py-3 sm:px-8 sm:py-3.5 text-base rounded-md transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 bg-white/10 backdrop-blur-xl hover:bg-white/20" />
          </div>
        </div>

        {/* Slide navigation dots */}
        <div className="absolute bottom-3 inset-x-0 z-10 flex items-center justify-center gap-2 sm:justify-end sm:right-8 sm:inset-x-auto">
          <Skeleton className="w-8 h-2 rounded-full" />
          <Skeleton className="w-2 h-2 rounded-full" />
          <Skeleton className="w-2 h-2 rounded-full" />
          <Skeleton className="w-2 h-2 rounded-full" />
          <Skeleton className="w-2 h-2 rounded-full" />
        </div>
      </div>
    </section>
  );
}