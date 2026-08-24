import { Link, useNavigate } from "@tanstack/react-router";
import { Play, Sparkles } from "lucide-react";
import { useState, useRef } from "react";
import type { Movie } from "@/lib/types";
import { LazyImage } from "./LazyImage";

export function MovieCard({
  movie,
  progress,
  reason,
  reasonLink,
  fluid = false,
  rank,
}: {
  movie: Movie;
  progress?: number;
  reason?: string;
  reasonLink?: string;
  fluid?: boolean;
  rank?: number;
}) {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);

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
    // Only mark as dragging if significant movement - let parent handle scroll
    if (deltaX > 15 || deltaY > 15) {
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
      className={`group relative ${fluid ? "w-full" : "w-[175px] sm:w-[220px] shrink-0"}`}
      data-context="movie"
      data-title={movie.title}
      data-url={`/movie/${movie.id}`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setIsDragging(false)}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-surface shadow-md transition-shadow duration-300 group-hover:shadow-2xl">
        {movie.poster ? (
          <LazyImage
            src={movie.poster}
            alt={movie.title}
            width={400}
            height={600}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid size-full place-items-center bg-card p-2 text-center text-xs text-muted-foreground">
            {movie.title}
          </div>
        )}

        {/* Centered play button on hover (visual only) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10 pointer-events-none" aria-hidden="true">
          <div className="flex size-12 items-center justify-center rounded-full bg-white/90 text-black shadow-lg backdrop-blur-sm">
            <Play className="size-5 fill-current" />
          </div>
        </div>

        {/* Title + meta on hover */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
          <p className="text-xs sm:text-sm font-bold text-white line-clamp-1 drop-shadow-lg">
            {movie.title}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs mt-0.5">
            <span className="text-emerald-400">
              {movie.score != null
                ? movie.score.toFixed(1)
                : movie.match
                  ? `${(movie.match / 10).toFixed(1)}`
                  : ""}
            </span>
            <span className="text-muted-foreground/40">&middot;</span>
            <span className="text-muted-foreground">{movie.year}</span>
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
