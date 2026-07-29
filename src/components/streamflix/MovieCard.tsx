import { Link } from "@tanstack/react-router";
import type { Movie } from "@/lib/types";

export function MovieCard({ movie, progress }: { movie: Movie; progress?: number }) {
  return (
    <div className="group relative w-[160px] sm:w-[200px] md:w-[240px] shrink-0">
      <Link
        to={progress != null ? "/watch/$id" : "/movie/$id"}
        params={{ id: movie.id }}
        className="block relative aspect-[2/3] overflow-hidden rounded-md bg-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition-transform duration-200 ease-out hover:scale-[1.04]"
        aria-label={progress != null ? `Continue ${movie.title}` : `Details for ${movie.title}`}
      >
        {movie.poster ? (
          <img
            src={movie.poster}
            alt={movie.title}
            loading="lazy"
            width={400}
            height={600}
            className="size-full object-cover transition-all duration-500"
          />
        ) : (
          <div className="grid size-full place-items-center bg-card text-xs text-muted-foreground p-2 text-center">
            {movie.title}
          </div>
        )}
        {progress != null && (
          <>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-foreground/20">
              <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
            <div className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
              {progress >= 95 ? "Done" : `${Math.round(progress)}%`}
            </div>
          </>
        )}
      </Link>
    </div>
  );
}
