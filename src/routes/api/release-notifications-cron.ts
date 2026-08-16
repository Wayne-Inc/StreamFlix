import { createFileRoute } from "@tanstack/react-router";
import { getMessaging } from "firebase-admin/messaging";
import { adminDb } from "@/lib/firebase.server";

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
          const snap = await adminDb
            .collection("release_notifications")
            .where("release_date", "==", today)
            .get();

          if (snap.empty) {
            return Response.json({ ok: true, sent: 0 });
          }

          const byUser = new Map<string, { id: string; title: string; movieId: string }[]>();
          snap.forEach((doc) => {
            const d = doc.data();
            if (d.reminded_at) return;
            const list = byUser.get(d.user_id) ?? [];
            list.push({ id: doc.id, title: d.title, movieId: d.movie_id });
            byUser.set(d.user_id, list);
          });

          if (byUser.size === 0) {
            return Response.json({ ok: true, sent: 0 });
          }

          const messaging = getMessaging();
          let sent = 0;
          let batch = adminDb.batch();

          for (const [userId, items] of byUser) {
            const tokensSnap = await adminDb
              .collection("fcm_tokens")
              .where("user_id", "==", userId)
              .get();
            const tokens = tokensSnap.docs.map((d) => d.data().token as string);
            if (tokens.length === 0) continue;

            for (const item of items) {
              const res = await messaging.sendEachForMulticast({
                tokens,
                notification: {
                  title: `${item.title} is now available`,
                  body: "Your reminder just landed on StreamFlix.",
                },
                data: { movie_id: item.movieId, url: `/movie/${item.movieId}` },
                webpush: {
                  fcmOptions: {
                    link: `${import.meta.env.VITE_SITE_URL ?? ""}/movie/${item.movieId}`,
                  },
                },
              });
              if (res.successCount > 0) {
                sent += res.successCount;
                batch.update(adminDb.collection("release_notifications").doc(item.id), {
                  reminded_at: new Date(),
                });
              }
            }
          }

          await batch.commit();
          return Response.json({ ok: true, sent });
        } catch (err) {
          return Response.json({ ok: false, error: String(err) }, { status: 500 });
        }
      },
    },
  },
});
