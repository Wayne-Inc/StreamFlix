import { createFileRoute } from "@tanstack/react-router";
import { authenticateRequest } from "@/server/server-auth";
import { createCustomToken } from "@/server/firebase-admin";
import { ANIFLIX_ORIGIN, ANIFLIX_HANDOFF_HASH_PARAM } from "@/lib/aniflix";

/**
 * Redirects the browser to AniFlix. The custom token (when present) travels in
 * the URL fragment so it is never sent to AniFlix's server, Cloudflare, or any
 * referrer. AniFlix consumes the fragment, signs in with it, and strips it from
 * the address bar.
 */
function redirectTo(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      "Cache-Control": "no-store, max-age=0",
      "CDN-Cache-Control": "no-store",
      Vary: "Cookie",
      "Referrer-Policy": "no-referrer",
    },
  });
}

export const Route = createFileRoute("/api/aniflix-handoff")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);

        // Kids profiles are intentionally handed off as a plain visit: AniFlix
        // has no PIN gate of its own, so minting a session there would let a
        // child bypass StreamFlix's parental lock.
        if (url.searchParams.get("skip") === "1") {
          return redirectTo(`${ANIFLIX_ORIGIN}/`);
        }

        try {
          const user = await authenticateRequest(request);
          if (!user) {
            // Not signed in (or the server session is unavailable): AniFlix
            // will show its own sign-in screen.
            return redirectTo(`${ANIFLIX_ORIGIN}/`);
          }

          const token = await createCustomToken(user.uid, { aniflix: true });
          if (!token) {
            // Admin SDK not configured (e.g. local dev without service-account
            // credentials). The link still works, just without single sign-on.
            return redirectTo(`${ANIFLIX_ORIGIN}/`);
          }

          return redirectTo(
            `${ANIFLIX_ORIGIN}/#${ANIFLIX_HANDOFF_HASH_PARAM}=${encodeURIComponent(token)}`,
          );
        } catch (error) {
          console.error("[AniFlix handoff] Failed to create login token:", error);
          return redirectTo(`${ANIFLIX_ORIGIN}/`);
        }
      },
    },
  },
});
