import { Link, useNavigate } from "@tanstack/react-router";
import { Play, Sparkles, Bookmark, BookmarkCheck, Clock, Star } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { Movie } from "@/lib/types";
import { LazyImage } from "./LazyImage";
import { isInMyList, toggleMyList, MY_LIST_EVENT } from "@/lib/my-list";
import { toast } from "sonner";
import { buildTitleLogoUrl } from "@/lib/title-logo";

export function MovieCard({
  movie,
  progress,
  reason,
  reasonLink,
  fluid = false,
  rank,
  landscape = false,
}: {
  movie: Movie;
  progress?: number;
  reason?: string;
  reasonLink?: string;
  fluid?: boolean;
  rank?: number;
  landscape?: boolean;
}) {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [isInList, setIsInList] = useState(() => isInMyList(movie.id));
  const startX = useRef(0);
  const startY = useRef(0);

  // Listen for my-list updates from other components (optimistic sync)
  useEffect(() => {
    const handleUpdate = () => setIsInList(isInMyList(movie.id));
    window.addEventListener(MY_LIST_EVENT, handleUpdate);
    return () => window.removeEventListener(MY_LIST_EVENT, handleUpdate);
  }, [movie.id]);

  const goToInfo = () => {
    navigate({ to: "/movie/$id", params: { id: movie.id } });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaX = Math.abs(e.touches[0].clientX - startX.current);
    const deltaY = Math.abs(e.touches[0].clientY - startY.current);
    // Only mark as dragging for horizontal movement (carousel scroll)
    // Vertical movement should allow page scroll - don't set isDragging
    if (deltaX > 15 && deltaX > deltaY) {
      setIsDragging(true);
    }
  };

  const handleClick = () => {
    if (!isDragging) {
      goToInfo();
    }
  };

  return (
    <div
      className={`group relative ${fluid ? "w-full" : landscape ? "w-[280px] sm:w-[380px] shrink-0" : "w-[175px] sm:w-[220px] shrink-0"}`}
      data-context="movie"
      data-title={movie.title}
      data-url={`/movie/${movie.id}`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setIsDragging(false)}
    >
      <div className={`relative ${landscape ? "aspect-video" : "aspect-[2/3]"} overflow-hidden rounded-xl bg-surface shadow-md transition-shadow duration-300 group-hover:shadow-2xl`}>
        {(landscape ? movie.backdropSm || movie.backdrop : movie.poster) ? (
          <LazyImage
            src={landscape ? movie.backdropSm || movie.backdrop : movie.poster}
            alt={movie.title}
            width={landscape ? 800 : 400}
            height={landscape ? 450 : 600}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid size-full place-items-center bg-card p-2 text-center text-xs text-muted-foreground">
            {movie.title}
          </div>
        )}

        {/* Bottom gradient for text contrast - shows on hover */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/95 via-background/40 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top-left rating badge - moved right when rank badge exists (Top 10/Trending) */}
        {movie.score != null && (
          <div className={`absolute top-2 z-10 flex items-center gap-1 rounded-full bg-black/70 backdrop-blur-lg px-2 py-1 border border-yellow-400/30 ${rank != null ? "left-10" : "left-2"}`}>
            <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-yellow-400 font-bold text-[11px] sm:text-xs">{movie.score.toFixed(1)}</span>
          </div>
        )}

        {/* Centered play button on hover (visual only) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10 pointer-events-none" aria-hidden="true">
          <div className="flex size-12 items-center justify-center rounded-full bg-white/90 text-black shadow-lg backdrop-blur-sm">
            <Play className="size-5 fill-current" />
          </div>
        </div>

        {/* Watchlist button at top-right on hover - with optimistic updates */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Optimistic update - immediately update UI
            const newState = !isInList;
            setIsInList(newState);
            toast.success(newState ? "Added to My List" : "Removed from My List");

            // Actual toggle (localStorage + Firestore sync)
            try {
              toggleMyList(movie);
            } catch {
              // Revert on error (shouldn't happen for localStorage, but safety)
              setIsInList(isInList);
              toast.error("Failed to update list. Please try again.");
            }
          }}
          className="absolute top-2 right-2 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-label={isInList ? "Remove from My List" : "Add to My List"}
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-sm hover:bg-black/80 transition-colors">
            {isInList ? (
              <BookmarkCheck className="size-5 fill-current" />
            ) : (
              <Bookmark className="size-5" />
            )}
          </div>
        </button>

        {/* Title + meta (always visible for landscape, hover for portrait) */}
        <div className={`absolute inset-x-0 bottom-0 p-3 ${landscape ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100"}`}>
          {landscape && movie.logo?.filePath ? (
            <img
              src={buildTitleLogoUrl(movie.logo.filePath)}
              alt={movie.title}
              draggable={false}
              className="mb-2 mx-auto max-h-12 w-auto max-w-full object-contain select-none"
            />
          ) : (
            <p className="text-xs sm:text-sm font-bold text-white line-clamp-1 drop-shadow-lg">
              {movie.title}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs mt-0.5">
            <span className="text-muted-foreground">{movie.year}</span>
            {(movie.runtime || movie.runtimeMinutes) && (
              <>
                <span className="text-muted-foreground/40">&middot;</span>
                <span className="inline-flex items-center gap-1 text-white/80">
                  <Clock className="size-2.5" />
                  {movie.runtime || (movie.runtimeMinutes ? `${Math.floor(movie.runtimeMinutes / 60)}h ${movie.runtimeMinutes % 60}m` : '')}
                </span>
              </>
            )}
          </div>
          {reason && (
            <p className="mt-1 flex items-center gap-1 text-[10px] sm:text-[11px] text-purple-300">
              <Sparkles className="size-3 shrink-0" />
              {reasonLink ? (
                <Link
                  to="/movie/$id"
                  params={{ id: reasonLink }}
                  className="line-clamp-1 underline decoration-purple-300/40 underline-offset-2 hover:text-purple-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  {reason}
                </Link>
              ) : (
                <span className="line-clamp-1">{reason}</span>
              )}
            </p>
          )}
        </div>

        {/* Rank badge */}
        {rank != null && (
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
            <span className="text-[9px] leading-tight uppercase tracking-wide">Top</span>
            <span className="text-[11px] leading-none -mt-0.5 tabular-nums">
              {String(rank).padStart(2, "0")}
            </span>
          </div>
        )}

        {/* Progress bar */}
        {progress != null && (
          <>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-foreground/20">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
              {progress >= 95 ? "Done" : `${Math.round(progress)}%`}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
