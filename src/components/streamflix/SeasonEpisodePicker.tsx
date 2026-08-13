import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { fetchTvSeason } from "@/lib/api/tmdb";

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
}: {
  movieId: string;
  numberOfSeasons: number;
  currentSeason?: number;
  currentEpisode?: number;
}) {
  const [selectedSeason, setSelectedSeason] = useState(currentSeason ?? 1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Season</p>
      <div className="flex flex-wrap gap-1.5">
        {seasonNumbers.map((s) => (
          <button
            key={s}
            onClick={() => setSelectedSeason(s)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-300 ease-in-out transform hover:scale-105 ${
              s === selectedSeason
                ? "bg-primary text-primary-foreground shadow-md scale-105"
                : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <p className="mb-2 mt-4 text-xs uppercase tracking-wider text-muted-foreground">
        Episodes
      </p>
      {loading ? (
        <div className="text-xs text-muted-foreground">Loading episodes…</div>
      ) : episodes.length === 0 ? (
        <div className="text-xs text-muted-foreground">No episodes found.</div>
      ) : (
        <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {episodes.map((ep) => (
            <div
              key={ep.episode_number}
              className={`flex items-center gap-2 rounded-md border p-1.5 transition-all duration-300 ease-in-out transform hover:scale-[1.01] ${
                currentEpisode === ep.episode_number && currentSeason === selectedSeason
                  ? "border-primary bg-card shadow-md scale-[1.01]"
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
