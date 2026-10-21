import { Mail, Instagram } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { DownloadAppButton } from "@/components/streamflix/DownloadAppButton";
import { ContactEmail } from "@/components/streamflix/ContactEmail";

export function Footer() {
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
          <DownloadAppButton
            iconClassName="size-3.5"
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/20 disabled:opacity-50"
          />
        </nav>
      </div>
    </footer>
  );
}
