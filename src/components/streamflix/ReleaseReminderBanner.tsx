import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { auth } from "@/lib/firebase";
import { getUserNotifications, markReminded } from "@/lib/release-notifications";

type Due = { movieId: string; title: string; poster: string };

export function ReleaseReminderBanner() {
  const [due, setDue] = useState<Due[] | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    getUserNotifications(user.uid)
      .then((list) => {
        const matches = list.filter((n) => {
          if (n.reminded_at) return false;
          if (!n.release_date) return false;
          const d = new Date(`${n.release_date}T00:00:00`);
          return !isNaN(d.getTime()) && d.getTime() <= today.getTime();
        });
        if (matches.length === 0) {
          setDue(null);
          return;
        }
        setDue(
          matches.map((n) => ({ movieId: n.movie_id, title: n.title, poster: n.poster })),
        );
        matches.forEach((n) => markReminded(user.uid, n.movie_id).catch(() => {}));
      })
      .catch(() => {});
  }, []);

  if (!due || due.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-primary/40 bg-card/95 p-4 shadow-2xl backdrop-blur">
      <button
        onClick={() => setDue(null)}
        aria-label="Dismiss"
        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" />
      </button>
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
          <Bell className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Now available to watch</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {due.map((d) => (
              <Link
                key={d.movieId}
                to="/movie/$id"
                params={{ id: d.movieId }}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-surface py-1 pl-1 pr-3 text-xs hover:border-primary"
              >
                {d.poster ? (
                  <img src={d.poster} alt="" className="size-5 rounded-full object-cover" />
                ) : null}
                <span className="truncate">{d.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
