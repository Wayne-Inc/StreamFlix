// Polyfill __dirname for ES modules (fixes Firebase Admin SDK / google-gax on Vercel)
import { fileURLToPath } from "url";
import { dirname } from "path";
globalThis.__dirname = dirname(fileURLToPath(import.meta.url));

import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

// Server-side auth middleware - runs before TanStack Start handler
// This enables true SSR redirect for authenticated users on protected routes
async function authMiddleware(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Paths that require authentication
  const protectedPaths = [
    "/",
    "/profiles",
    "/browse",
    "/watch/",
    "/explore",
    "/search",
    "/calendar",
    "/history",
    "/mylist",
    "/settings",
    "/assistant",
    "/force-password",
  ];

  // Check if this path requires auth
  const requiresAuth = protectedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!requiresAuth) return null;

  // Import server auth dynamically (only runs on server)
  const { authenticateRequest } = await import("./server/server-auth");
  const user = await authenticateRequest(request);

  if (!user) {
    // Redirect to auth page with return URL
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("redirect", pathname + url.search);
    return Response.redirect(loginUrl.toString(), 302);
  }

  // User is authenticated - continue to TanStack Start handler
  return null;
}

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      // Run auth middleware first for protected routes
      const authResponse = await authMiddleware(request);
      if (authResponse) return authResponse;

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
