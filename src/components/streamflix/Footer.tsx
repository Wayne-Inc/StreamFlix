import { Github, Instagram, Mail } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { DownloadAppButton } from "@/components/streamflix/DownloadAppButton";
import { ContactEmail } from "@/components/streamflix/ContactEmail";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background px-4 pt-10 pb-28 text-sm text-muted-foreground sm:px-8 md:pb-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center text-2xl sm:text-2xl md:text-3xl font-black text-foreground shrink-0">
            <span className="text-primary">STREAM</span>
            <span className="text-foreground">FLIX</span>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-3 gap-y-2 text-xs sm:text-sm text-muted-foreground">
            <ContactEmail className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors whitespace-nowrap">
              <Mail className="size-3.5" />
            </ContactEmail>
            <a
              href="https://instagram.com/itiswayneee"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors whitespace-nowrap"
            >
              <Instagram className="size-3.5" /> @itiswayneee
            </a>
            <a
              href="https://github.com/Wayne-Inc/StreamFlix"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors whitespace-nowrap"
            >
              <Github className="size-3.5" /> GitHub
            </a>
            <div className="flex items-center gap-3 whitespace-nowrap">
            <Link to="/tos" className="hover:text-foreground transition-colors whitespace-nowrap">
              Terms of Service
            </Link>
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors whitespace-nowrap">
              Privacy Policy
            </Link>
          </div>
            <DownloadAppButton
              iconClassName="size-3.5"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors disabled:opacity-50 whitespace-nowrap"
            />
          </div>
        </div>
        <p className="mt-6 text-xs text-left text-muted-foreground">
          Made for the people, by the people. Not affiliated with Netflix. Film and series data from
          TMDB; this product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
        <p className="mt-2 text-xs text-left text-muted-foreground">
          <strong>Disclaimer:</strong> StreamFlix is an indexing service for media that is already
          publicly available elsewhere. We do not store, upload, or modify any video files. Every
          stream is embedded from independent third-party providers, and ownership of that content
          remains entirely with its original rights holders.
        </p>
      </div>
    </footer>
  );
}
