import { createFileRoute } from "@tanstack/react-router";

const RECAPTCHA_PROJECT = "streamflix-e91bc";
const RECAPTCHA_SITE_KEY = "6Ley4pEtAAAAAEYBuciRyro32EY15v0BAsfwkzAV";
const SCORE_THRESHOLD = 0.5;

export const Route = createFileRoute("/api/verify-recaptcha")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json();
          const { token, action } = body as { token?: string; action?: string };

          if (!token) {
            return new Response(JSON.stringify({ ok: false, error: "Missing token" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const apiKey = process.env.RECAPTCHA_API_KEY || (import.meta as any).env?.VITE_FIREBASE_API_KEY;
          if (!apiKey) {
            console.error("RECAPTCHA_API_KEY env var not set");
            return new Response(JSON.stringify({ ok: false, error: "Server config error" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          const assessRes = await fetch(
            `https://recaptchaenterprise.googleapis.com/v1/projects/${RECAPTCHA_PROJECT}/assessments?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                event: {
                  token,
                  siteKey: RECAPTCHA_SITE_KEY,
                  expectedAction: action || "signin",
                },
              }),
            },
          );

          const data = await assessRes.json();

          if (!data.tokenProperties?.valid) {
            return new Response(
              JSON.stringify({
                ok: false,
                score: 0,
                reason: data.tokenProperties?.invalidReason || "invalid_token",
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            );
          }

          const score = data.riskAnalysis?.score ?? 0;
          const reasons = data.riskAnalysis?.reasons ?? [];

          if (data.tokenProperties?.action !== action) {
            return new Response(
              JSON.stringify({ ok: false, score, reasons, reason: "action_mismatch" }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            );
          }

          if (score < SCORE_THRESHOLD) {
            return new Response(
              JSON.stringify({ ok: false, score, reasons, reason: "low_score" }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            );
          }

          return new Response(JSON.stringify({ ok: true, score, reasons }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("reCAPTCHA verification error:", err);
          return new Response(JSON.stringify({ ok: false, error: "Internal error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
