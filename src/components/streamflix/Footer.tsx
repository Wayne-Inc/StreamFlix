import { Github, Instagram, Mail, MessageCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { DownloadAppButton } from "@/components/streamflix/DownloadAppButton";
import { ContactEmail } from "@/components/streamflix/ContactEmail";

export function Footer() {
  const openFeedback = () => {
    if (typeof window !== "undefined" && window.ProductBridge) {
      window.ProductBridge.toggle();
    }
  };

  return (
    <footer className="border-t border-border bg-background px-4 pt-10 pb-28 text-sm text-muted-foreground sm:px-8 md:pb-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center text-2xl sm:text-2xl md:text-3xl font-black text-foreground shrink-0">
            <span className="text-primary">STREAM</span>
            <span className="text-foreground">FLIX</span>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 text-sm sm:text-base text-muted-foreground">
            <ContactEmail className="inline-flex items-center gap-2 px-3 py-2 hover:text-foreground transition-colors whitespace-nowrap min-h-[44px] rounded-md">
              <Mail className="size-4 sm:size-3.5" />
            </ContactEmail>
            <a
              href="https://instagram.com/itiswayneee"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 hover:text-foreground transition-colors whitespace-nowrap min-h-[44px] rounded-md"
            >
              <Instagram className="size-4 sm:size-3.5" /> @itiswayneee
            </a>
            <a
              href="https://github.com/Wayne-Inc/StreamFlix"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 hover:text-foreground transition-colors whitespace-nowrap min-h-[44px] rounded-md"
            >
              <Github className="size-4 sm:size-3.5" /> GitHub
            </a>
            <button
              onClick={openFeedback}
              className="inline-flex items-center gap-2 px-3 py-2 hover:text-foreground transition-colors whitespace-nowrap min-h-[44px] rounded-md"
              aria-label="Give feedback"
            >
              <MessageCircle className="size-4 sm:size-3.5" /> Feedback
            </button>
            <Link to="/tos" className="inline-flex items-center gap-2 px-3 py-2 hover:text-foreground transition-colors whitespace-nowrap min-h-[44px] rounded-md">
              Terms of Service
            </Link>
            <Link to="/privacy-policy" className="inline-flex items-center gap-2 px-3 py-2 hover:text-foreground transition-colors whitespace-nowrap min-h-[44px] rounded-md">
              Privacy Policy
            </Link>
            <DownloadAppButton
              iconClassName="size-4 sm:size-3.5"
              className="inline-flex items-center gap-2 px-3 py-2 hover:text-foreground transition-colors disabled:opacity-50 whitespace-nowrap min-h-[44px] rounded-md"
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
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var s = document.createElement('script');
              s.src = 'https://app.productbridge.io/sdk/pb-widget.js';
              s.async = true;
              s.onload = function() {
                ProductBridge.init({
                  organizationId: 'b6336e27-6355-401a-b3ee-8b9645d9a8da',
                  customTrigger: true,
                });
              };
              document.head.appendChild(s);
            })();
          `,
        }}
      />
    </footer>
  );
}
