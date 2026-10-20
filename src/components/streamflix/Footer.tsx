import { Download, Mail, Instagram } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { isInApp } from "@/lib/app-downloads";
import { canPromptInstall, isPWAInstalled, promptInstall } from "@/lib/pwa";
import { ContactEmail } from "@/components/streamflix/ContactEmail";
import { useEffect, useState } from "react";

export function Footer() {
  const [showInstall, setShowInstall] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isInApp() || isPWAInstalled()) return;
    setShowInstall(canPromptInstall());
    const check = () => setShowInstall(canPromptInstall());
    window.addEventListener("beforeinstallprompt", check as EventListener);
    window.addEventListener("appinstalled", check as EventListener);
    return () => {
      window.removeEventListener("beforeinstallprompt", check as EventListener);
      window.removeEventListener("appinstalled", check as EventListener);
    };
  }, []);

  const handleInstall = async () => {
    if (installing) return;
    setInstalling(true);
    await promptInstall();
    setInstalling(false);
    setShowInstall(canPromptInstall());
  };

  return (
    <footer className="border-t border-border bg-background px-4 sm:px-8 py-6 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 sm:flex-row sm:justify-between">
        <p className="text-center text-xs sm:text-left sm:text-sm">
          Made by Wayne Inc
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 text-xs text-muted-foreground sm:justify-end">
          <ContactEmail className="inline-flex items-center gap-1.5 transition hover:text-foreground">
            <Mail className="size-4" />
          </ContactEmail>
          <a
            href="https://instagram.com/itiswayneee"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition hover:text-foreground"
          >
            <Instagram className="size-4" /> @itiswayneee
          </a>
          <Link to="/tos" className="hover:text-foreground">
            Terms of Service
          </Link>
          <Link to="/privacy-policy" className="hover:text-foreground">
            Privacy Policy
          </Link>
          {!isInApp() && !isPWAInstalled() && showInstall && (
            <button
              onClick={handleInstall}
              disabled={installing}
              className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/20 disabled:opacity-50"
            >
              <Download className="size-3.5" />
              {installing ? "Installing..." : "Install app"}
            </button>
          )}
          {!isInApp() && !isPWAInstalled() && !showInstall && (
            <a
              href="https://github.com/Wayne-Inc/StreamFlix/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/20"
            >
              <Download className="size-3.5" />
              Download the app
            </a>
          )}
        </nav>
      </div>
    </footer>
  );
}
