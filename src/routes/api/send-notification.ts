import { createFileRoute } from "@tanstack/react-router";
import { runFirestoreQuery, sendFcmMulticast } from "@/lib/firebase-rest";

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const siteUrl = (import.meta.env.VITE_SITE_URL ?? "").replace(/\/+$/, "");

async function verifyIdToken(idToken: string): Promise<string | null> {
  try {
    const apiKey = (import.meta as any).env?.VITE_FIREBASE_API_KEY;
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.users?.[0]?.localId ?? null;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/send-notification")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const authHeader = request.headers.get("authorization");
          if (!authHeader?.startsWith("Bearer ")) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
          const uid = await verifyIdToken(authHeader.slice(7));
          if (!uid) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const body = await request.json();
          const { title, body: msgBody, target, specificUserIds, imageUrl, clickAction } = body as {
            title?: string;
            body?: string;
            target?: "all" | "vip" | "specific";
            specificUserIds?: string[];
            imageUrl?: string;
            clickAction?: string;
          };

          if (!title || !msgBody) {
            return Response.json({ error: "Title and body are required" }, { status: 400 });
          }

          let tokenRows: Array<{ id: string; data: Record<string, unknown> }> = [];

          if (target === "vip") {
            const vipRows = await runFirestoreQuery(projectId, "vip", []);
            const vipIds = new Set(vipRows.map((r) => r.id));
            const allTokens = await runFirestoreQuery(projectId, "fcm_tokens", []);
            tokenRows = allTokens.filter((t) => vipIds.has(t.data.user_id as string));
          } else if (target === "specific" && specificUserIds?.length) {
            const allTokens = await runFirestoreQuery(projectId, "fcm_tokens", []);
            const idSet = new Set(specificUserIds);
            tokenRows = allTokens.filter((t) => idSet.has(t.data.user_id as string));
          } else {
            tokenRows = await runFirestoreQuery(projectId, "fcm_tokens", []);
          }

          const tokens = tokenRows.map((r) => r.data.token as string).filter(Boolean);
          if (tokens.length === 0) {
            return Response.json({ ok: true, successCount: 0, failureCount: 0, total: 0 });
          }

          const url = clickAction || siteUrl || "/";
          const result = await sendFcmMulticast(
            projectId,
            tokens,
            { title, body: msgBody },
            { url, ...(imageUrl ? { image: imageUrl } : {}) },
          );

          return Response.json({
            ok: true,
            successCount: result.successCount,
            failureCount: result.failureCount,
            total: tokens.length,
          });
        } catch (err) {
          console.error("send-notification error:", err);
          return Response.json({ error: "Internal error" }, { status: 500 });
        }
      },
    },
  },
});
