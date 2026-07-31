import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { fetchTvSeason } from "@/lib/api/tmdb";
import { tryDownloadFromServers, openDownloadSource } from "@/lib/offline";

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
  const [downloading, setDownloading] = useState<number | null>(null);

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

  const handleDownload = async (episodeNumber: number) => {
    setDownloading(episodeNumber);
    toast.loading("Finding source…", { id: "dl-ep" });
    const result = await tryDownloadFromServers(movieId, selectedSeason, episodeNumber);
    toast.dismiss("dl-ep");
    setDownloading(null);
    if (result.ok) {
      openDownloadSource(result);
      toast.success(
        result.direct ? `Downloading from ${result.name}…` : `Opening ${result.name}…`,
      );
    } else {
      toast.error("No source available");
    }
  };

  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Season</p>
      <div className="flex flex-wrap gap-1.5">
        {seasonNumbers.map((s) => (
          <button
            key={s}
            onClick={() => setSelectedSeason(s)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              s === selectedSeason
                ? "bg-primary text-primary-foreground"
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
              <button
                onClick={() => handleDownload(ep.episode_number)}
                disabled={downloading === ep.episode_number}
                className="grid size-7 shrink-0 place-items-center rounded-md border border-border text-muted-foreground transition hover:border-foreground hover:text-foreground disabled:opacity-50"
                aria-label={`Download episode ${ep.episode_number}`}
              >
                <Download className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
