import { createFileRoute } from "@tanstack/react-router";
import { runFirestoreQuery, sendFcmMulticast } from "@/lib/firebase-rest";
import { createErrorResponse } from "@/lib/error-handler";
import { tmdbFetch, toMovie } from "@/lib/api/tmdb.server";

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const cronSecret = process.env.CRON_SECRET;

async function verifyCronAuth(request: Request): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }
  const secret = authHeader.slice(7);
  return secret === cronSecret;
}

async function getNewReleases(): Promise<Array<{ id: string; title: string; poster: string; releaseDate: string }>> {
  try {
    // Get upcoming movies (released in the last 7 days)
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dateFormat = (d: Date) => d.toISOString().split("T")[0];

    const [movies, tv] = await Promise.all([
      tmdbFetch("/movie/now_playing", {
        "release_date.gte": dateFormat(weekAgo),
        "release_date.lte": dateFormat(now),
        sort_by: "release_date.desc",
        page: "1",
      }),
      tmdbFetch("/tv/airing_today", {
        page: "1",
      }),
    ]);

    const items: Array<{ id: string; title: string; poster: string; releaseDate: string }> = [];

    // Add new movies
    for (const m of (movies.results || []).slice(0, 5)) {
      const movie = toMovie(m);
      items.push({
        id: movie.id,
        title: movie.title,
        poster: movie.poster,
        releaseDate: movie.releaseDate || "",
      });
    }

    // Add new TV episodes (airing today)
    for (const t of (tv.results || []).slice(0, 5)) {
      const show = toMovie(t);
      items.push({
        id: `tv-${show.id}`,
        title: show.title,
        poster: show.poster,
        releaseDate: show.releaseDate || "",
      });
    }

    return items;
  } catch (error) {
    console.error("Failed to fetch new releases:", error);
    return [];
  }
}

export const Route = createFileRoute("/api/release-notifications-cron")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          // Verify cron authorization
          if (!(await verifyCronAuth(request))) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          if (!projectId) {
            return Response.json({ error: "Firebase project ID not configured" }, { status: 500 });
          }

          // Get new releases
          const newReleases = await getNewReleases();
          if (newReleases.length === 0) {
            return Response.json({ ok: true, message: "No new releases found", sent: 0 });
          }

          // Get all FCM tokens from Firestore
          const tokenRows = await runFirestoreQuery(projectId, "fcm_tokens", []);
          const tokens = tokenRows
            .map((r) => r.data.token as string)
            .filter(Boolean);

          if (tokens.length === 0) {
            return Response.json({ ok: true, message: "No devices subscribed", sent: 0 });
          }

          // Build notification content
          const titles = newReleases.slice(0, 3).map((r) => r.title).join(", ");
          const title = `🎬 New on StreamFlix: ${titles}${newReleases.length > 3 ? "..." : ""}`;
          const body = `${newReleases.length} new title${newReleases.length > 1 ? "s" : ""} just dropped. Tap to explore!`;

          // Send push notifications
          const result = await sendFcmMulticast(
            projectId,
            tokens,
            { title, body },
            { url: "/browse?kind=new", type: "new_releases" }
          );

          return Response.json({
            ok: true,
            sent: result.successCount,
            failed: result.failureCount,
            total: tokens.length,
            releases: newReleases.length,
          });
        } catch (err) {
          console.error("release-notifications-cron error:", err);
          return createErrorResponse(err, 500);
        }
      },
    },
  },
});