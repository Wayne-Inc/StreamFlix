import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, Monitor, ShieldCheck, Smartphone } from "lucide-react";
import { Logo } from "@/components/streamflix/Logo";
import {
  APP_DOWNLOADS,
  detectInstallPlatform,
  isInApp,
  type InstallPlatform,
} from "@/lib/app-downloads";

export const Route = createFileRoute("/download")({
  head: () => ({
    meta: [
      { title: "Download StreamFlix — Desktop & Mobile Apps" },
      { name: "description", content: "Download the StreamFlix desktop app for Windows or the mobile app for Android." },
    ],
  }),
  component: DownloadPage,
});

function DownloadPage() {
  const [platform, setPlatform] = useState<InstallPlatform>("other");

  useEffect(() => {
    setPlatform(detectInstallPlatform());
  }, []);

  return (
    <main className="min-h-dvh bg-background text-foreground px-4 py-8 sm:px-8">
      <header className="mx-auto mb-10 flex max-w-4xl items-center justify-between gap-4">
        <Logo className="text-lg sm:text-xl" />
        <Link
          to="/"
          className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:border-foreground hover:text-foreground"
        >
          Back to Home
        </Link>
      </header>

      <div className="mx-auto max-w-4xl space-y-10">
        <div className="text-center">
          <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-muted-foreground">
            Get the StreamFlix app
          </p>
          <h1 className="mt-2 text-4xl font-black sm:text-5xl">Download StreamFlix</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            The app gives you the best StreamFlix experience — faster, smoother, and right on your
            device. Pick the download for your device below.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <DownloadCard
            platform="windows"
            icon={<Monitor className="size-8" />}
            recommended={platform}
          />
          <DownloadCard
            platform="android"
            icon={<Smartphone className="size-8" />}
            recommended={platform}
          />
        </div>

        <section className="space-y-4 rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <ShieldCheck className="size-5 text-primary" /> What you need to know
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base leading-relaxed text-muted-foreground">
            <li>
              The desktop app is available for <strong className="text-foreground">Windows 10 and 11</strong>. The mobile app
              is available for <strong className="text-foreground">Android</strong> phones and tablets.
            </li>
            <li>
              Before installing an Android APK, you may need to allow "Install unknown apps" in your
              device settings.
            </li>
            <li>
              Sign in with your StreamFlix account after installing to keep your history, My List,
              and progress in sync.
            </li>
            <li>Windows may show a SmartScreen prompt — choose "More info" then "Run anyway".</li>
          </ul>
        </section>
      </div>
    </main>
  );
}

function DownloadCard({
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
      <a
        href={info.url}
        download={info.file}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition hover:bg-primary/90"
      >
        <Download /> Download for {info.label}
      </a>
    </div>
  );
}
