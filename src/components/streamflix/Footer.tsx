import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { APP_DOWNLOADS, detectInstallPlatform, isInApp } from "@/lib/app-downloads";

const SHORT_LINK = "https://itiswayneee.dpdns.org/eg8vpq";

export function Footer() {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadLabel, setDownloadLabel] = useState<string>("");

  useEffect(() => {
    if (isInApp()) return;
    const p = detectInstallPlatform();
    if (p === "windows") {
      setDownloadUrl(APP_DOWNLOADS.windows.url);
      setDownloadLabel("Download for Windows");
    } else if (p === "android") {
      setDownloadUrl(APP_DOWNLOADS.android.url);
      setDownloadLabel("Download for Android");
    } else {
      setDownloadUrl(SHORT_LINK);
      setDownloadLabel("Download the app");
    }
  }, []);

  return (
    <footer className="border-t border-border bg-background px-4 sm:px-8 py-12 text-sm text-muted-foreground">
      <div className="mx-auto max-w-6xl space-y-8">
        <nav className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <Link to="/tos" className="hover:text-foreground">
            Terms of Service
          </Link>
          <Link to="/privacy-policy" className="hover:text-foreground">
            Privacy Policy
          </Link>
          {downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/20"
            >
              <Download className="size-3.5" />
              {downloadLabel}
            </a>
          )}
        </nav>
        <div className="max-w-2xl space-y-2 rounded-lg border border-yellow-500/10 bg-yellow-500/5 px-4 py-3 text-[10px] sm:text-xs leading-relaxed text-yellow-400/80">
          <p>
            This is a project created by{" "}
            <strong className="text-yellow-400/90">Samwel Wayne</strong>.
          </p>
          <p>
            Redistribution, reproduction, or public display of any part of this platform without the
            express written consent of Samwel Wayne is strictly prohibited. This includes, but is
            not limited to, copying, modifying, or re-uploading the software, design, or any content
            accessed through it.
          </p>
        </div>
      </div>
    </footer>
  );
}
