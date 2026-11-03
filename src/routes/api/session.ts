import { createFileRoute } from "@tanstack/react-router";
import { createSessionCookie, setSessionCookie, isAdminInitialized, clearSessionCookie } from "@/server/server-auth";

export const Route = createFileRoute("/api/session")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          if (!isAdminInitialized()) {
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
          const { idToken } = body as { idToken?: string };

          if (!idToken) {
            return new Response(
              JSON.stringify({ ok: false, error: "Missing ID token" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          const sessionCookie = await createSessionCookie(idToken);

          const response = new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });

          setSessionCookie(response, sessionCookie);
          return response;
        } catch (err) {
          return new Response(
            JSON.stringify({ ok: false, error: "Internal server error" }),
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