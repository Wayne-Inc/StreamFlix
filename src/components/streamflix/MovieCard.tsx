import { Link } from "@tanstack/react-router";
import { Play, Info, Sparkles } from "lucide-react";
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
  return (
    <div
      className={`group relative ${fluid ? "w-full" : "w-[175px] sm:w-[220px] shrink-0"}`}
      data-context="movie"
      data-title={movie.title}
      data-url={`/movie/${movie.id}`}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-surface shadow-md transition-shadow duration-300 group-hover:shadow-2xl">
        <Link
          to={progress != null ? "/watch/$id" : "/movie/$id"}
          params={{ id: movie.id }}
          className="block size-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          aria-label={progress != null ? `Continue ${movie.title}` : `Details for ${movie.title}`}
        >
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
        </Link>

        {/* Quick action overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-3 pointer-events-none group-hover:pointer-events-auto">
          <p className="text-xs sm:text-sm font-bold text-white line-clamp-1 mb-1">{movie.title}</p>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs mb-2">
            <span className="text-emerald-400">
              {movie.score != null ? movie.score.toFixed(1) : (movie.match ? `${(movie.match / 10).toFixed(1)}` : "")}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-muted-foreground">{movie.year}</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-muted-foreground">{movie.id.startsWith("tv-") ? "Show" : "Movie"}</span>
          </div>
          {reason && (
            <p className="mb-2 flex items-center gap-1 text-[10px] sm:text-[11px] text-purple-300">
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
          <div className="flex items-center gap-2">
            <Link
              to="/watch/$id"
              params={{ id: movie.id }}
              search={{ autoplay: true }}
              className="flex items-center justify-center gap-1 rounded bg-white text-black px-3 py-1.5 text-xs font-semibold hover:bg-white/85 transition"
              title="Play"
            >
              <Play className="size-3.5 fill-current" /> Play
            </Link>
            <Link
              to="/movie/$id"
              params={{ id: movie.id }}
              className="flex items-center justify-center gap-1 rounded bg-white/20 text-white backdrop-blur px-3 py-1.5 text-xs font-semibold hover:bg-white/30 transition"
              title="More Info"
            >
              <Info className="size-3.5" /> Info
            </Link>
          </div>
        </div>

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
