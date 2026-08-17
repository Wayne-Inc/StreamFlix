import { createFileRoute } from "@tanstack/react-router";
import { runFirestoreQuery, updateFirestoreDoc, sendFcmMulticast } from "@/lib/firebase-rest";

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function isCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth === `Bearer ${secret}`) return true;
  }
  const schedule = request.headers.get("x-vercel-cron-schedule");
  const ua = (request.headers.get("user-agent") ?? "").toLowerCase();
  return Boolean(schedule) || ua.includes("vercel-cron");
}

export const Route = createFileRoute("/api/release-notifications-cron")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        if (!isCronRequest(request)) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const today = todayUtc();
        try {
          const rows = await runFirestoreQuery(projectId, "release_notifications", [
            { field: "release_date", op: "EQUAL", value: today },
          ]);

          const due = rows.filter((r) => !r.data.reminded_at);
          if (due.length === 0) {
            return Response.json({ ok: true, sent: 0 });
          }

          const byUser = new Map<string, { id: string; title: string; movieId: string }[]>();
          for (const r of due) {
            const uid = r.data.user_id as string;
            const list = byUser.get(uid) ?? [];
            list.push({ id: r.id, title: r.data.title as string, movieId: r.data.movie_id as string });
            byUser.set(uid, list);
          }

          const siteUrl = (import.meta.env.VITE_SITE_URL ?? "").replace(/\/+$/, "");
          let sent = 0;

          for (const [userId, items] of byUser) {
            const tokenRows = await runFirestoreQuery(projectId, "fcm_tokens", [
              { field: "user_id", op: "EQUAL", value: userId },
            ]);
            const tokens = tokenRows.map((r) => r.data.token as string).filter(Boolean);
            if (tokens.length === 0) continue;

            for (const item of items) {
              const res = await sendFcmMulticast(projectId, tokens, {
                title: `${item.title} is now available`,
                body: "Your reminder just landed on StreamFlix.",
              }, {
                movie_id: item.movieId,
                url: `${siteUrl}/movie/${item.movieId}`,
              });
              if (res.successCount > 0) {
                sent += res.successCount;
                await updateFirestoreDoc(projectId, "release_notifications", item.id, {
                  reminded_at: new Date(),
                });
              }
            }
          }

          return Response.json({ ok: true, sent });
        } catch (err) {
          return Response.json({ ok: false, error: String(err) }, { status: 500 });
        }
      },
    },
  },
});
