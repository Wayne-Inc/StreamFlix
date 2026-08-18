import { useEffect, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Eye } from "lucide-react";
import { fetchTvSeason } from "@/lib/api/tmdb";
import {
  getWatchedEpisodeSet,
  markEpisodeWatched,
  unmarkEpisodeWatched,
  markSeasonWatched,
  unmarkSeasonWatched,
} from "@/lib/continue-watching";
import type { Movie } from "@/lib/types";
import { toast } from "sonner";

type Episode = {
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  vote_average: number;
};

export function SeasonEpisodePicker({
  movieId,
  numberOfSeasons,
  currentSeason,
  currentEpisode,
  movie,
}: {
  movieId: string;
  numberOfSeasons: number;
  currentSeason?: number;
  currentEpisode?: number;
  movie?: Movie;
}) {
  const [selectedSeason, setSelectedSeason] = useState(currentSeason ?? 1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);
  const [watchedSet, setWatchedSet] = useState<Set<string>>(new Set());

  const refreshWatched = useCallback(() => {
    setWatchedSet(getWatchedEpisodeSet(movieId));
  }, [movieId]);

  useEffect(() => {
    refreshWatched();
    const handler = () => refreshWatched();
    window.addEventListener("sf:watchedUpdated", handler);
    return () => window.removeEventListener("sf:watchedUpdated", handler);
  }, [refreshWatched]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTvSeason({ data: { id: movieId.replace(/^tv-/, ""), season: selectedSeason } })
      .then((data: any) => {
        if (!cancelled) setEpisodes(data.episodes || []);
      })
      .catch(() => {
        if (!cancelled) setEpisodes([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [movieId, selectedSeason]);

  const seasonNumbers = Array.from({ length: numberOfSeasons }, (_, i) => i + 1);

  const seasonWatchedCount = episodes.filter((ep) =>
    watchedSet.has(`S${selectedSeason}E${ep.episode_number}`),
  ).length;
  const allSeasonWatched = episodes.length > 0 && seasonWatchedCount === episodes.length;

  const toggleEpisode = (ep: number, watched: boolean) => {
    if (!movie) return;
    if (watched) {
      unmarkEpisodeWatched(movieId, selectedSeason, ep);
    } else {
      markEpisodeWatched(movie, selectedSeason, ep);
    }
    refreshWatched();
    toast.success(watched ? "Episode unmarked" : "Episode marked as watched");
  };

  const toggleSeason = () => {
    if (!movie) return;
    if (allSeasonWatched) {
      unmarkSeasonWatched(movieId, selectedSeason);
      toast.success(`Season ${selectedSeason} unmarked`);
    } else {
      markSeasonWatched(movie, selectedSeason, episodes.length);
      toast.success(`Season ${selectedSeason} marked as watched`);
    }
    refreshWatched();
  };

  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Season</p>
      <div className="flex flex-wrap gap-1.5">
        {seasonNumbers.map((s) => (
          <button
            key={s}
            onClick={() => setSelectedSeason(s)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 ${
              s === selectedSeason
                ? "bg-primary text-primary-foreground scale-105"
                : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 mb-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Episodes</p>
        {movie && episodes.length > 0 && (
          <button
            onClick={toggleSeason}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition ${
              allSeasonWatched
                ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                : "bg-white/10 text-muted-foreground hover:bg-white/20 hover:text-foreground"
            }`}
          >
            <Eye className="size-3" />
            {allSeasonWatched ? "Season watched" : "Mark season"}
          </button>
        )}
      </div>
      {loading ? (
        <div className="text-xs text-muted-foreground">Loading episodes…</div>
      ) : episodes.length === 0 ? (
        <div className="text-xs text-muted-foreground">No episodes found.</div>
      ) : (
        <div className="space-y-1.5">
          {episodes.map((ep) => {
            const watched = watchedSet.has(`S${selectedSeason}E${ep.episode_number}`);
            return (
              <div
                key={ep.episode_number}
                className={`flex items-center gap-2 rounded-md border p-1.5 transition ${
                  currentEpisode === ep.episode_number && currentSeason === selectedSeason
                    ? "border-primary bg-card"
                    : "border-border hover:bg-card/80"
                }`}
              >
                <Link
                  to="/watch/$id"
                  params={{ id: movieId }}
                  search={{
                    season:
                      ep.episode_number === currentEpisode && selectedSeason === currentSeason
                        ? undefined
                        : selectedSeason,
                    episode: ep.episode_number,
                  }}
                  className="flex min-w-0 flex-1 items-center gap-2.5"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded bg-surface text-xs font-semibold text-muted-foreground">
                    {ep.episode_number}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium text-foreground">
                      {ep.name || `Episode ${ep.episode_number}`}
                    </span>
                    {ep.air_date && (
                      <span className="block text-[11px] text-muted-foreground">{ep.air_date}</span>
                    )}
                  </span>
                </Link>
                {movie && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleEpisode(ep.episode_number, watched);
                    }}
                    className={`shrink-0 size-7 flex items-center justify-center rounded transition ${
                      watched
                        ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                        : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                    }`}
                    aria-label={watched ? "Unmark episode" : "Mark episode as watched"}
                  >
                    <Check className="size-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
