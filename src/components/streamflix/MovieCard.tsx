import { Link } from "@tanstack/react-router";
import { Play, Info } from "lucide-react";
import type { Movie } from "@/lib/types";

export function MovieCard({ movie, progress }: { movie: Movie; progress?: number }) {
  return (
    <div className="group relative w-[200px] sm:w-[260px] aspect-[2/3] shrink-0">
      {/* Default portrait poster card */}
      <div className="size-full overflow-hidden rounded-md bg-surface shadow-md transition-opacity duration-200 group-hover:opacity-0">
        <Link
          to={progress != null ? "/watch/$id" : "/movie/$id"}
          params={{ id: movie.id }}
          className="block size-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          aria-label={progress != null ? `Continue ${movie.title}` : `Details for ${movie.title}`}
        >
          {movie.poster ? (
            <img
              src={movie.poster}
              alt={movie.title}
              loading="lazy"
              width={400}
              height={600}
              className="size-full object-cover"
            />
          ) : (
            <div className="grid size-full place-items-center bg-card p-2 text-center text-xs text-muted-foreground">
              {movie.title}
            </div>
          )}
        </Link>
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

      {/* Expanded rectangle landscape preview card on hover */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 w-[300px] sm:w-[360px] -translate-x-1/2 -translate-y-1/2 opacity-0 scale-95 transition-all duration-300 ease-out group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100">
        <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-2xl ring-1 ring-white/10">
          {/* Landscape Backdrop Image */}
          <div className="relative aspect-video w-full overflow-hidden bg-surface">
            <img
              src={movie.backdrop || movie.poster}
              alt={movie.title}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-black/20 to-transparent" />
            <div className="absolute bottom-2 left-3 right-3">
              <span className="text-sm font-bold text-white drop-shadow line-clamp-1">
                {movie.title}
              </span>
            </div>
          </div>

          {/* Details & Quick Action Buttons */}
          <div className="p-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="text-emerald-400">{movie.match}% Match</span>
              <span className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {movie.rating}
              </span>
              <span className="text-muted-foreground">{movie.year}</span>
              {movie.runtime && <span className="text-muted-foreground">{movie.runtime}</span>}
            </div>

            {movie.genres && movie.genres.length > 0 && (
              <p className="text-[11px] text-muted-foreground truncate">
                {movie.genres.join(" · ")}
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Link
                to="/watch/$id"
                params={{ id: movie.id }}
                search={{ autoplay: true }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition hover:bg-foreground/85"
              >
                <Play className="size-3.5 fill-current" /> Play
              </Link>
              <Link
                to="/movie/$id"
                params={{ id: movie.id }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-card hover:border-foreground"
              >
                <Info className="size-3.5" /> More Info
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
