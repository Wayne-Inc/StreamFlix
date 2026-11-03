import { createFileRoute } from "@tanstack/react-router";

function clientIp(request: Request): string {
  const headers = request.headers;
  const cf = headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const vercel = headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0].trim();
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "";
}

export const Route = createFileRoute("/api/client-ip")({
  server: {
    handlers: {
      GET: ({ request }: { request: Request }) => Response.json({ ip: clientIp(request) }),
    },
  },
});
