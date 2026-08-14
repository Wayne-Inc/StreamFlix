import { useEffect, useState } from "react";
import { Download, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  APP_DOWNLOADS,
  detectInstallPlatform,
  isInApp,
  type InstallPlatform,
} from "@/lib/app-downloads";

export function DownloadApp() {
  const [platform, setPlatform] = useState<InstallPlatform>("other");

  useEffect(() => {
    setPlatform(detectInstallPlatform());
  }, []);

  if (isInApp()) return null;

  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-center text-4xl font-black sm:text-5xl">Get the StreamFlix app</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
          The app gives you the best StreamFlix experience — faster, smoother, and right on your
          device. Pick the download for your device below.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <InstallCard
            platform="windows"
            icon={<Monitor className="size-8" />}
            recommended={platform}
          />
          <InstallCard
            platform="android"
            icon={<Smartphone className="size-8" />}
            recommended={platform}
          />
        </div>

        {platform !== "other" && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Not what you're looking for? Grab the other version above instead.
          </p>
        )}
      </div>
    </section>
  );
}

function InstallCard({
  platform,
  icon,
  recommended,
}: {
  platform: "windows" | "android";
  icon: React.ReactNode;
  recommended: InstallPlatform;
}) {
  const info = APP_DOWNLOADS[platform];
  const isRecommended = recommended === platform;

  return (
    <div
      className={`flex flex-col items-center rounded-xl border p-8 text-center transition ${
        isRecommended
          ? "border-primary bg-card shadow-lg ring-1 ring-primary"
          : "border-border bg-surface hover:border-primary/50"
      }`}
    >
      {isRecommended && (
        <span className="mb-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
          Recommended for your device
        </span>
      )}
      <div className="text-primary">{icon}</div>
      <h3 className="mt-4 text-2xl font-bold">{info.label}</h3>
      <p className="mt-2 min-h-10 text-sm text-muted-foreground">{info.description}</p>
      <p className="mt-3 text-xs font-medium text-muted-foreground">
        {info.file} · {info.size}
      </p>
      <Button asChild className="mt-6 w-full">
        <a href={info.url} download={info.file}>
          <Download /> Download for {info.label}
        </a>
      </Button>
    </div>
  );
}
