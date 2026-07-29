import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { exchangeTraktCode } from "@/lib/api/trakt";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/trakt-callback")({
  validateSearch: z.object({
    code: z.string().optional(),
    error: z.string().optional(),
  }),
  head: () => ({ meta: [{ title: "Connecting Trakt — StreamFlix" }] }),
  component: TraktCallback,
});

function TraktCallback() {
  const { code, error } = Route.useSearch();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>("Connecting to Trakt...");

  useEffect(() => {
    if (error) {
      setStatus(`Trakt error: ${error}`);
      return;
    }
    if (!code) {
      setStatus("Missing authorization code.");
      return;
    }
    const redirectUri = `${window.location.origin}/trakt-callback`;
    exchangeTraktCode({ data: { code, redirectUri } })
      .then((tok) => {
        window.localStorage.setItem(
          "streamflix:trakt",
          JSON.stringify({
            accessToken: tok.accessToken,
            refreshToken: tok.refreshToken,
            expiresAt: Date.now() + tok.expiresIn * 1000,
            username: tok.username,
            name: tok.name,
            avatar: tok.avatar,
          }),
        );
        setStatus(`Connected as @${tok.username ?? "trakt user"}. Redirecting...`);
        setTimeout(() => navigate({ to: "/settings" }), 800);
      })
      .catch((e) => setStatus(`Failed: ${e?.message ?? "unknown error"}`));
  }, [code, error, navigate]);

  return (
    <div className="grid min-h-dvh place-items-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
