import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Trash2, Clock, Play, Film, X, ChevronDown, ChevronRight, Tv } from "lucide-react";
import { Navbar } from "@/components/streamflix/Navbar";
import { Footer } from "@/components/streamflix/Footer";
import { LazyImage } from "@/components/streamflix/LazyImage";
import { Skeleton } from "@/components/ui/skeleton";
import { getWatchHistory, type WatchHistoryItem } from "@/lib/continue-watching";
import {
  getWatchHistoryFromFirestore,
  removeHistoryFromFirestore,
  clearHistoryFromFirestore,
} from "@/lib/history-firestore";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "Watch History — StreamFlix" }] }),
  component: HistoryPage,
});

function baseId(id: string): string {
  return id.includes(":") ? id.split(":")[0] : id;
}

function isTvItem(item: WatchHistoryItem): boolean {
  return item.id.startsWith("tv-") || item.id.includes(":S");
}

type TvGroup = {
  baseId: string;
  show: WatchHistoryItem;
  episodes: WatchHistoryItem[];
};

function HistoryPage() {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const local = getWatchHistory();
      const merged = new Map<string, WatchHistoryItem>();
      for (const item of local) merged.set(item.id, item);
      try {
        const fs = await getWatchHistoryFromFirestore();
        for (const item of fs) {
          const existing = merged.get(item.id);
          if (!existing || item.watchedAt > existing.watchedAt) merged.set(item.id, item);
        }
      } catch {}
      if (!cancelled) {
        setHistory(
          Array.from(merged.values()).sort((a, b) => b.watchedAt - a.watchedAt),
        );
        setLoaded(true);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const { movies, tvGroups } = useMemo(() => {
    const movieItems: WatchHistoryItem[] = [];
    const groupMap = new Map<string, WatchHistoryItem[]>();

    for (const item of history) {
      if (isTvItem(item)) {
        const bid = baseId(item.id);
        if (!groupMap.has(bid)) groupMap.set(bid, []);
        groupMap.get(bid)!.push(item);
      } else {
        movieItems.push(item);
      }
    }

    const groups: TvGroup[] = [];
    for (const [bid, episodes] of groupMap) {
      episodes.sort((a, b) => {
        if (a.season != null && b.season != null) {
          if (a.season !== b.season) return a.season - b.season;
          return (a.episode ?? 0) - (b.episode ?? 0);
        }
        return b.watchedAt - a.watchedAt;
      });
      groups.push({
        baseId: bid,
        show: episodes[0],
        episodes,
      });
    }
    groups.sort((a, b) => b.show.watchedAt - a.show.watchedAt);

    return { movies: movieItems, tvGroups: groups };
  }, [history]);

  const toggleGroup = (bid: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(bid)) next.delete(bid);
      else next.add(bid);
      return next;
    });
  };

  const clearAll = () => {
    try {
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith("streamflix:watch_history"),
      );
      keys.forEach((k) => localStorage.removeItem(k));
      setHistory([]);
      clearHistoryFromFirestore().catch(() => {});
    } catch {}
  };

  const removeItem = (id: string) => {
    try {
      const key = Object.keys(localStorage).find((k) => k.startsWith("streamflix:watch_history"));
      if (!key) return;
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const list = JSON.parse(raw) as WatchHistoryItem[];
      const bid = baseId(id);
      const filtered = list.filter((x) => x.id !== id && !x.id.startsWith(`${bid}:`));
      localStorage.setItem(key, JSON.stringify(filtered));
      setHistory((prev) => prev.filter((x) => x.id !== id && !x.id.startsWith(`${bid}:`)));
      removeHistoryFromFirestore(bid).catch(() => {});
    } catch {}
  };

  const removeEpisode = (id: string) => {
    try {
      const key = Object.keys(localStorage).find((k) => k.startsWith("streamflix:watch_history"));
      if (!key) return;
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const list = JSON.parse(raw) as WatchHistoryItem[];
      const filtered = list.filter((x) => x.id !== id);
      localStorage.setItem(key, JSON.stringify(filtered));
      setHistory((prev) => prev.filter((x) => x.id !== id));
      removeHistoryFromFirestore(id).catch(() => {});
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
            {movies.map((item) => (
              <Link
                key={item.id}
                to="/watch/$id"
                params={{ id: item.id }}
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

            {tvGroups.map((group) => {
              const expanded = expandedGroups.has(group.baseId);
              return (
                <div
                  key={group.baseId}
                  className="rounded-lg border border-border bg-surface/40 overflow-hidden"
                >
                  <div
                    className="flex items-center gap-4 p-3 transition-colors hover:bg-surface/80 cursor-pointer group sm:p-4"
                    onClick={() => toggleGroup(group.baseId)}
                  >
                    <div className="relative shrink-0">
                      <LazyImage
                        src={group.show.poster || "/placeholder.svg"}
                        alt={group.show.title}
                        className="h-16 w-12 rounded object-cover sm:h-20 sm:w-14"
                      />
                      <div className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 rounded">
                        <Tv className="size-5 text-white" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-sm sm:text-base">
                        {group.show.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {group.show.year} &middot; {group.episodes.length} episode{group.episodes.length !== 1 ? "s" : ""} watched
                      </p>
                      <p className="text-xs text-muted-foreground/70 line-clamp-1 mt-1">
                        {group.show.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeItem(group.baseId);
                        }}
                        className="text-muted-foreground hover:text-destructive p-1"
                        aria-label="Remove show"
                      >
                        <X className="size-4" />
                      </button>
                      {expanded ? (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {expanded && (
                    <div className="border-t border-border">
                      {group.episodes.map((ep) => (
                        <Link
                          key={ep.id}
                          to="/watch/$id"
                          params={{ id: group.baseId }}
                          search={
                            ep.season != null && ep.episode != null
                              ? { season: ep.season, episode: ep.episode }
                              : {}
                          }
                          className="flex items-center gap-3 px-4 py-2.5 sm:px-6 transition-colors hover:bg-surface/60 group/ep"
                        >
                          <div className="shrink-0 w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                            <Play className="size-3.5 text-white/70" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {ep.episodeLabel || `E${ep.episode}`}
                            </p>
                            <p className="text-[11px] text-muted-foreground/60">
                              {new Date(ep.watchedAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeEpisode(ep.id);
                            }}
                            className="shrink-0 text-muted-foreground/40 hover:text-destructive p-1 opacity-0 group-hover/ep:opacity-100 transition-opacity"
                            aria-label="Remove episode"
                          >
                            <X className="size-3.5" />
                          </button>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
