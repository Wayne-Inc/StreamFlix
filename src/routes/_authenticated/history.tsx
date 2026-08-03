import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Trash2, Clock, Play, Film, X } from "lucide-react";
import { Navbar } from "@/components/streamflix/Navbar";
import { Footer } from "@/components/streamflix/Footer";
import { LazyImage } from "@/components/streamflix/LazyImage";
import { Skeleton } from "@/components/ui/skeleton";
import { getWatchHistory, type WatchHistoryItem } from "@/lib/continue-watching";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "Watch History — StreamFlix" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setHistory(getWatchHistory());
    setLoaded(true);
  }, []);

  const clearAll = () => {
    try {
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith("streamflix:watch_history"),
      );
      keys.forEach((k) => localStorage.removeItem(k));
      setHistory([]);
    } catch {}
  };

  const removeItem = (id: string) => {
    try {
      const key = Object.keys(localStorage).find((k) => k.startsWith("streamflix:watch_history"));
      if (!key) return;
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const list = JSON.parse(raw) as WatchHistoryItem[];
      const filtered = list.filter((x) => x.id !== id);
      localStorage.setItem(key, JSON.stringify(filtered));
      setHistory(filtered);
    } catch {}
  };

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pt-24 pb-12 sm:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2 sm:text-3xl">
            <Clock className="size-6" />
            Watch History
          </h1>
          {history.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="size-4" /> Clear All
            </button>
          )}
        </div>

        {!loaded ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="mt-20 text-center">
            <Film className="mx-auto size-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No watch history yet.</p>
            <Link
              to="/browse"
              className="mt-4 inline-block rounded bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Browse Movies & Shows
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <Link
                key={item.id}
                to="/watch/$id"
                params={{ id: item.id.includes(":") ? item.id.split(":")[0] : item.id }}
                search={
                  item.season != null && item.episode != null
                    ? { season: item.season, episode: item.episode }
                    : {}
                }
                className="flex items-center gap-4 rounded-lg border border-border bg-surface/40 p-3 transition-colors hover:bg-surface/80 group sm:p-4"
              >
                <div className="relative shrink-0">
                  <LazyImage
                    src={item.poster || "/placeholder.svg"}
                    alt={item.title}
                    className="h-16 w-12 rounded object-cover sm:h-20 sm:w-14"
                  />
                  <div className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 rounded">
                    <Play className="size-6 text-white" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-sm sm:text-base">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.year} &middot; {item.runtime}
                    {item.episodeLabel && <span> &middot; {item.episodeLabel}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground/70 line-clamp-1 mt-1">
                    {item.description}
                  </p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1">
                    {new Date(item.watchedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeItem(item.id);
                  }}
                  className="shrink-0 text-muted-foreground hover:text-destructive p-1"
                  aria-label="Remove"
                >
                  <X className="size-4" />
                </button>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
