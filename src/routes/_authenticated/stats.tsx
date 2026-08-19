import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Clock,
  Film,
  Tv,
  TrendingUp,
  ArrowLeft,
  Star,
  Calendar,
} from "lucide-react";
import { Navbar } from "@/components/streamflix/Navbar";
import { Footer } from "@/components/streamflix/Footer";
import { auth } from "@/lib/firebase";
import { getContinueWatching } from "@/lib/continue-watching";
import { getMyList } from "@/lib/my-list";
import { getWatchHistory } from "@/lib/continue-watching";
import { getContinueWatchingFromFirestore } from "@/lib/continue-watching-firestore";
import { getWatchHistoryFromFirestore } from "@/lib/history-firestore";
import { getMyListFromFirestore } from "@/lib/my-list-firestore";
import { isKidsProfile } from "@/lib/kids-mode";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const GENRE_NAMES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const COLORS = [
  "#E50914",
  "#b81d24",
  "#f5c518",
  "#1ce783",
  "#6366f1",
  "#ec4899",
  "#f97316",
  "#14b8a6",
  "#8b5cf6",
  "#06b6d4",
];

export const Route = createFileRoute("/_authenticated/stats")({
  head: () => ({ meta: [{ title: "Your Stats — StreamFlix" }] }),
  component: StatsPage,
});

function StatsPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [myList, setMyList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const localHistory = getWatchHistory();
        const localContinue = getContinueWatching();
        const localList = getMyList();

        let fsHistory: any[] = [];
        let fsContinue: any[] = [];
        let fsList: any[] = [];

        try {
          fsHistory = await getWatchHistoryFromFirestore();
        } catch {}
        try {
          fsContinue = await getContinueWatchingFromFirestore();
        } catch {}
        try {
          fsList = await getMyListFromFirestore();
        } catch {}

        // Merge history
        const historyMap = new Map<string, any>();
        for (const h of localHistory) historyMap.set(h.id, h);
        for (const h of fsHistory) {
          const existing = historyMap.get(h.id);
          if (!existing || h.watchedAt > (existing.watchedAt ?? 0)) {
            historyMap.set(h.id, h);
          }
        }
        setHistory(Array.from(historyMap.values()));

        // Merge continue watching
        const continueMap = new Map<string, any>();
        for (const c of localContinue) continueMap.set(c.id, c);
        for (const c of fsContinue) {
          const existing = continueMap.get(c.movieId);
          if (!existing || c.updatedAt > (existing.updatedAt ?? 0)) {
            continueMap.set(c.movieId, c);
          }
        }
        setContinueWatching(Array.from(continueMap.values()));

        // Merge my list
        const listMap = new Map<string, any>();
        for (const l of localList) listMap.set(l.id, l);
        for (const l of fsList) {
          const existing = listMap.get(l.id);
          if (!existing || l.addedAt > (existing.addedAt ?? 0)) {
            listMap.set(l.id, l);
          }
        }
        setMyList(Array.from(listMap.values()));
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const totalWatched = history.length;
    const totalInProgress = continueWatching.length;
    const totalMyList = myList.length;

    // Genre breakdown
    const genreCounts = new Map<string, number>();
    for (const item of history) {
      const genreIds: number[] = item.genreIds ?? [];
      for (const gid of genreIds) {
        const name = GENRE_NAMES[gid] ?? "Other";
        genreCounts.set(name, (genreCounts.get(name) ?? 0) + 1);
      }
    }
    const genreData = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Movies vs TV
    let movieCount = 0;
    let tvCount = 0;
    for (const item of history) {
      if (item.id?.startsWith?.("tv-")) tvCount++;
      else movieCount++;
    }

    // Estimated watch time (assuming ~120min per movie, ~45min per TV episode)
    const estimatedMinutes = movieCount * 120 + tvCount * 45;
    const estimatedHours = Math.round(estimatedMinutes / 60);

    // Watch activity by day of week (last 30 days)
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    for (const item of history) {
      if ((item.watchedAt ?? 0) > thirtyDaysAgo) {
        const d = new Date(item.watchedAt);
        dayCounts[d.getDay()]++;
      }
    }
    const activityData = dayNames.map((name, i) => ({ name, count: dayCounts[i] }));

    return {
      totalWatched,
      totalInProgress,
      totalMyList,
      genreData,
      movieCount,
      tvCount,
      estimatedHours,
      activityData,
    };
  }, [history, continueWatching, myList]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-background">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 pt-28 pb-20 sm:px-8">
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-lg bg-surface" />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pt-28 pb-20 sm:px-8">
        <div className="mb-8 flex items-center gap-4">
          <Link
            to="/settings"
            className="grid size-10 place-items-center rounded-full border border-border bg-card/60 text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Stats</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your streaming habits at a glance.
            </p>
          </div>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={<Film className="size-5" />}
            label="Titles Watched"
            value={stats.totalWatched}
          />
          <StatCard
            icon={<Clock className="size-5" />}
            label="Est. Hours"
            value={stats.estimatedHours}
          />
          <StatCard
            icon={<Tv className="size-5" />}
            label="In Progress"
            value={stats.totalInProgress}
          />
          <StatCard
            icon={<Star className="size-5" />}
            label="My List"
            value={stats.totalMyList}
          />
        </div>

        {/* Movies vs TV */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="mb-4 text-lg font-semibold">Movies vs TV</h2>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-4xl font-black text-primary">{stats.movieCount}</div>
                <div className="mt-1 text-sm text-muted-foreground">Movies</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <div className="text-4xl font-black text-blue-400">{stats.tvCount}</div>
                <div className="mt-1 text-sm text-muted-foreground">TV Shows</div>
              </div>
            </div>
            {stats.movieCount + stats.tvCount > 0 && (
              <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="bg-primary transition-all"
                  style={{
                    width: `${(stats.movieCount / (stats.movieCount + stats.tvCount)) * 100}%`,
                  }}
                />
                <div
                  className="bg-blue-400 transition-all"
                  style={{
                    width: `${(stats.tvCount / (stats.movieCount + stats.tvCount)) * 100}%`,
                  }}
                />
              </div>
            )}
          </div>

          {/* Weekly activity */}
          <div className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="mb-4 text-lg font-semibold">Weekly Activity</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.activityData}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#fafafa",
                    }}
                  />
                  <Bar dataKey="count" fill="#E50914" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Titles watched in the last 30 days
            </p>
          </div>
        </div>

        {/* Genre breakdown */}
        {stats.genreData.length > 0 && (
          <div className="mt-8 rounded-lg border border-border bg-card/40 p-6">
            <h2 className="mb-6 text-lg font-semibold">Top Genres</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.genreData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="count"
                    >
                      {stats.genreData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        color: "#fafafa",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {stats.genreData.map((g, i) => (
                  <div key={g.name} className="flex items-center gap-3">
                    <div
                      className="size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="flex-1 text-sm">{g.name}</span>
                    <span className="text-sm font-semibold">{g.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/40 p-4 sm:p-5">
      <div className="flex items-center gap-2 text-muted-foreground">{icon}</div>
      <div className="mt-3 text-3xl font-black">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
