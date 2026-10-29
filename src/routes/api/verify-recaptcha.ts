import { createFileRoute } from "@tanstack/react-router";
import { createErrorResponse } from "@/lib/error-handler";

export const Route = createFileRoute("/api/verify-recaptcha")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json();
          const { token, action } = body as { token?: string; action?: string };
          console.log("[Debug] API verify-recaptcha:", { hasToken: !!token, action });

          if (!token) {
            console.log("[Debug] API verify-recaptcha: Missing token");
            return new Response(JSON.stringify({ ok: false, error: "Missing token" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const secretKey =
            process.env.TURNSTILE_SECRET_KEY ||
            (import.meta.env as Record<string, string | undefined>).TURNSTILE_SECRET_KEY;
          console.log("[Debug] API verify-recaptcha: secretKey:", secretKey ? "SET" : "MISSING");
          if (!secretKey) {
            console.error("[Debug] API verify-recaptcha: TURNSTILE_SECRET_KEY env var not set");
            return new Response(JSON.stringify({ ok: false, error: "Server config error" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          const verifyRes = await fetch(
            `https://challenges.cloudflare.com/turnstile/v0/siteverify`,
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                secret: secretKey,
                response: token,
              }),
            },
          );

          const data = await verifyRes.json();
          console.log("[Debug] API verify-recaptcha: Turnstile response:", data);

          if (!data.success) {
            return new Response(
              JSON.stringify({
                ok: false,
                reasons: data["error-codes"] || [],
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            );
          }

          // Validate the action only when Turnstile echoed one back. The action is
          // only present when the widget was rendered with an `action` option, so a
          // missing action must not be treated as a mismatch.
          if (action && typeof data.action === "string" && data.action !== action) {
            console.log("[Debug] API verify-recaptcha: action mismatch", { expected: action, got: data.action });
            return new Response(JSON.stringify({ ok: false, reasons: ["action_mismatch"] }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify({ ok: true, reasons: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("[Debug] API verify-recaptcha: Exception:", err);
          return createErrorResponse(err, 500);
        }
      },
    },
  },
});
