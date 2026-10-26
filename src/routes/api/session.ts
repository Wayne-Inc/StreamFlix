import { createFileRoute } from "@tanstack/react-router";
import { createSessionCookie, setSessionCookie, isAdminInitialized, clearSessionCookie } from "@/server/server-auth";

// Module-level log to confirm this file loads
console.log("[API Session] MODULE LOADED");

export const Route = createFileRoute("/api/session")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          console.log("[API Session] POST request received");
          const { isAdminInitialized, createSessionCookie } = await import("@/server/firebase-admin");
          console.log("[API Session] Admin initialized:", isAdminInitialized());

          if (!isAdminInitialized()) {
            console.error("[API Session] Firebase Admin NOT initialized");
            return new Response(
              JSON.stringify({
                ok: false,
                error: "Server auth not configured",
                hint: "Add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY to Vercel environment variables"
              }),
              {
                status: 503,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          const body = await request.json();
          console.log("[API Session] Request body keys:", Object.keys(body));
          const { idToken } = body as { idToken?: string };

          if (!idToken) {
            console.error("[API Session] Missing ID token");
            return new Response(
              JSON.stringify({ ok: false, error: "Missing ID token" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              }
            );
          }
          console.log("[API Session] ID token received, length:", idToken.length);

          const sessionCookie = await createSessionCookie(idToken);
          console.log("[API Session] Session cookie created:", sessionCookie ? "YES" : "NO (null)");
          if (!sessionCookie) {
            console.error("[API Session] createSessionCookie returned null");
            return new Response(
              JSON.stringify({
                ok: false,
                error: "Failed to create session",
                hint: "Firebase Admin token verification failed - check credentials"
              }),
              {
                status: 500,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          const response = new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });

          setSessionCookie(response, sessionCookie);
          console.log("[API Session] Cookie set, returning success");
          return response;
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          const errStack = err instanceof Error ? err.stack : undefined;
          console.error("[API Session] Session creation error:", errMsg, errStack);
          // Return error detail in response so you can see it in Network tab
          return new Response(
            JSON.stringify({ ok: false, error: "Internal server error", detail: errMsg, stack: errStack }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
      DELETE: async () => {
        const response = new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });

        // Clear the session cookie
        const { clearSessionCookie } = await import("@/server/server-auth");
        clearSessionCookie(response);

        return response;
      },
    },
  },
});