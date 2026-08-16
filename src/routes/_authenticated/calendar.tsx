import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bell, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Film, Tv } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/streamflix/Navbar";
import { Footer } from "@/components/streamflix/Footer";
import { LazyImage } from "@/components/streamflix/LazyImage";
import { Skeleton } from "@/components/ui/skeleton";
import { loadUpcomingCalendar, loadAiringCalendar } from "@/lib/streamflix-data";
import type { CalendarTitle } from "@/lib/api/tmdb";
import { auth } from "@/lib/firebase";
import { toggleReleaseNotification, getNotifiedIds } from "@/lib/release-notifications";
import { isKidsProfile, filterKidsContent } from "@/lib/kids-mode";
import { startOfMonth, addMonths, format, isSameMonth } from "date-fns";

export const Route = createFileRoute("/_authenticated/calendar")({
  loader: async () => {
    const [movies, tv] = await Promise.all([loadUpcomingCalendar(), loadAiringCalendar()]);
    return { items: [...movies, ...tv] };
  },
  head: () => ({ meta: [{ title: "New & Coming Soon — StreamFlix" }] }),
  pendingComponent: () => (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 pt-24 pb-16 sm:px-8">
        <Skeleton className="h-10 w-72 rounded" />
        <Skeleton className="mt-2 h-4 w-52 rounded" />
        <Skeleton className="mt-8 h-96 rounded-lg" />
      </div>
    </div>
  ),
  component: CalendarPage,
});

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CalendarPage() {
  const { items } = Route.useLoaderData();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [notified, setNotified] = useState<Set<string>>(new Set());

  const kidsMode = useMemo(() => isKidsProfile(), []);
  const safeItems = useMemo(() => (kidsMode ? filterKidsContent(items) : items), [kidsMode, items]);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarTitle[]>();
    for (const item of safeItems) {
      if (!item.releaseDate) continue;
      const list = map.get(item.releaseDate) ?? [];
      list.push(item);
      map.set(item.releaseDate, list);
    }
    return map;
  }, [safeItems]);

  const monthItems = useMemo(() => {
    return safeItems
      .filter((item) =>
        item.releaseDate
          ? isSameMonth(new Date(`${item.releaseDate}T00:00:00`), month)
          : false,
      )
      .sort((a, b) => (a.releaseDate ?? "").localeCompare(b.releaseDate ?? ""));
  }, [safeItems, month]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    getNotifiedIds(user.uid)
      .then(setNotified)
      .catch(() => {});
  }, []);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const cells = useMemo(() => {
    const first = startOfMonth(month);
    const lead = first.getDay();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const out: (number | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= daysInMonth; d++) out.push(d);
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [month]);

  const toggle = async (item: CalendarTitle) => {
    const user = auth.currentUser;
    if (!user) return toast.error("Sign in to get notified about releases");
    if (item.releaseDate && item.releaseDate <= todayStr) {
      return toast.info("This title is already released");
    }
    const wasNotified = notified.has(item.id);
    setNotified((prev) => {
      const next = new Set(prev);
      if (wasNotified) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
    try {
      const added = await toggleReleaseNotification(user.uid, {
        id: item.id,
        title: item.title,
        poster: item.poster,
        releaseDate: item.releaseDate,
      });
      if (added) {
        const push = await import("@/lib/push").then((m) => m.ensurePushSubscription());
        toast.success(
          push === "granted"
            ? "Reminder set — we'll push a notification on release day"
            : "We'll let you know when it releases",
        );
      } else {
        toast.success("Notification removed");
      }
    } catch (err: unknown) {
      setNotified((prev) => {
        const next = new Set(prev);
        if (wasNotified) next.add(item.id);
        else next.delete(item.id);
        return next;
      });
      toast.error(
        err instanceof Error ? err.message : "Couldn't update notification. Please try again.",
      );
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pt-24 pb-16 sm:px-8">
        <div className="flex items-center gap-2 text-primary">
          <CalendarIcon className="size-6" />
          <span className="text-sm font-semibold uppercase tracking-widest">Release Calendar</span>
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
          New &amp; Coming Soon
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tap the bell to get a reminder when a title arrives.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setMonth(startOfMonth(new Date()))}
            disabled={isSameMonth(month, new Date())}
            className="order-1 inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/20 disabled:cursor-default disabled:opacity-40 lg:order-3"
          >
            Today
          </button>
          <h2 className="order-2 flex-1 text-center text-lg font-semibold capitalize lg:flex-none">
            {format(month, "MMMM yyyy")}
          </h2>
          <div className="order-3 flex items-center gap-2 lg:order-1">
            <button
              onClick={() => setMonth((m) => addMonths(m, -1))}
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" /> Previous
            </button>
            <button
              onClick={() => setMonth((m) => addMonths(m, 1))}
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              aria-label="Next month"
            >
              Next <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-6 hidden rounded-lg border border-border bg-card/40 p-3 sm:p-5 lg:block">
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {DAY_HEADERS.map((d) => (
              <div
                key={d}
                className="pb-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                <span className="hidden sm:inline">{d}</span>
                <span className="sm:hidden">{d[0]}</span>
              </div>
            ))}
            {cells.map((day, i) => {
              if (day == null) return <div key={`empty-${i}`} className="min-h-16 sm:min-h-24" />;
              const key = format(
                new Date(month.getFullYear(), month.getMonth(), day),
                "yyyy-MM-dd",
              );
              const dayItems = byDate.get(key) ?? [];
              const isToday = key === todayStr;
              return (
                <div
                  key={key}
                  className={`min-h-16 rounded-md border p-1 sm:min-h-24 sm:p-1.5 ${
                    isToday ? "border-primary" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-medium sm:text-sm ${
                        isToday ? "text-primary font-bold" : "text-muted-foreground"
                      }`}
                    >
                      {day}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-col gap-1">
                    {dayItems.slice(0, 3).map((item) => (
                      <div key={item.id} className="group relative">
                        <Link
                          to="/movie/$id"
                          params={{ id: item.id }}
                          className="flex items-center gap-1.5 rounded-sm hover:bg-accent/60"
                          title={item.title}
                        >
                          {item.poster ? (
                            <LazyImage
                              src={item.poster}
                              alt=""
                              className="size-8 rounded-sm object-cover sm:size-10"
                            />
                          ) : (
                            <span className="grid size-8 place-items-center rounded-sm bg-surface sm:size-10">
                              {item.media === "tv" ? (
                                <Tv className="size-3 text-muted-foreground" />
                              ) : (
                                <Film className="size-3 text-muted-foreground" />
                              )}
                            </span>
                          )}
                          <span className="hidden max-w-16 truncate text-[11px] leading-tight text-foreground lg:block">
                            {item.title}
                          </span>
                        </Link>
                        {item.releaseDate && item.releaseDate <= todayStr ? null : (
                          <button
                            onClick={() => toggle(item)}
                            aria-label={`Notify me: ${item.title}`}
                            className={`absolute -top-1 -right-1 grid size-4 place-items-center rounded-full border ${
                              notified.has(item.id)
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-muted-foreground opacity-0 group-hover:opacity-100"
                            }`}
                          >
                            <Bell className="size-2.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 space-y-2 lg:hidden">
          {monthItems.length === 0 ? (
            <div className="rounded-lg border border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
              No titles releasing in {format(month, "MMMM yyyy")}.
            </div>
          ) : (
            monthItems.map((item) => {
              const date = new Date(`${item.releaseDate}T00:00:00`);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card/40 p-2.5"
                >
                  <div className="w-14 shrink-0 text-center">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {format(date, "MMM")}
                    </div>
                    <div className="text-xl font-bold text-foreground">{format(date, "d")}</div>
                  </div>
                  <Link
                    to="/movie/$id"
                    params={{ id: item.id }}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    {item.poster ? (
                      <LazyImage
                        src={item.poster}
                        alt=""
                        className="h-16 w-11 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <span className="grid h-16 w-11 shrink-0 place-items-center rounded-md bg-surface">
                        {item.media === "tv" ? (
                          <Tv className="size-4 text-muted-foreground" />
                        ) : (
                          <Film className="size-4 text-muted-foreground" />
                        )}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {item.title}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {format(date, "EEEE, MMMM d")} · {item.media === "tv" ? "TV Show" : "Movie"}
                      </div>
                    </div>
                  </Link>
                  {item.releaseDate && item.releaseDate <= todayStr ? null : (
                    <button
                      onClick={() => toggle(item)}
                      aria-label={`Notify me: ${item.title}`}
                      className={`grid size-8 shrink-0 place-items-center rounded-full border ${
                        notified.has(item.id)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      <Bell className="size-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          {safeItems.length} upcoming titles · Dates from The Movie Database.
        </p>
      </main>
      <Footer />
    </div>
  );
}
