import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { WifiOff, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/offline")({
  ssr: false,
  head: () => ({ meta: [{ title: "Offline — StreamFlix" }] }),
  component: OfflinePage,
});

function OfflinePage() {
  const router = useRouter();
  const handleTryAgain = () => {
    const returnUrl = sessionStorage.getItem("sf:returnUrl");
    sessionStorage.removeItem("sf:returnUrl");
    router.navigate({ to: returnUrl || "/browse" });
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 text-center">
      <div className="grid size-20 place-items-center rounded-full bg-yellow-500/20">
        <WifiOff className="size-10 text-yellow-400" />
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">You're offline</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Check your internet connection and try again.
      </p>
      <div className="mt-8 flex gap-3">
        <button
          onClick={handleTryAgain}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <RefreshCw className="size-4" /> Try again
        </button>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
