import { Download, Github, Mail, Instagram } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { isInApp } from "@/lib/app-downloads";
import { ContactEmail } from "@/components/streamflix/ContactEmail";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background px-4 sm:px-8 py-12 text-sm text-muted-foreground">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="max-w-2xl">
          <p className="text-xs sm:text-sm">
            Built by <strong className="text-foreground">Samwel Wayne</strong>. Open source, free to
            use, modify, and share.
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
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
          <a
            href="https://github.com/Wayne-Inc/StreamFlix"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition hover:text-foreground"
          >
            <Github className="size-4" />
            GitHub
          </a>
          {!isInApp() && (
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
