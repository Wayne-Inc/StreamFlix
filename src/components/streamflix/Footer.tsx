import { Github, Instagram, Mail, MessageCircle, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { DownloadAppButton } from "@/components/streamflix/DownloadAppButton";
import { ContactEmail } from "@/components/streamflix/ContactEmail";
import { useEffect, useState } from "react";

export function Footer() {
  const [widgetReady, setWidgetReady] = useState(false);
  const [widgetError, setWidgetError] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);

  // Fetch user token for ProductBridge
  useEffect(() => {
    if (typeof window === "undefined") return;

    const fetchToken = async () => {
      try {
        const res = await fetch("/api/productbridge-token");
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.token) {
            setUserToken(data.token);
          }
        }
      } catch (err) {
        console.warn("Could not fetch ProductBridge user token:", err);
      }
    };

    fetchToken();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initProductBridge = () => {
      const existingScript = document.querySelector('script[src="https://app.productbridge.io/sdk/pb-widget.js"]');
      if (existingScript) {
        // Script already exists, check if ProductBridge is ready
        if (window.ProductBridge) {
          setWidgetReady(true);
        } else {
          // Wait for it to initialize
          const checkReady = setInterval(() => {
            if (window.ProductBridge) {
              setWidgetReady(true);
              clearInterval(checkReady);
            }
          }, 100);
          setTimeout(() => clearInterval(checkReady), 10000);
        }
        return;
      }

      const script = document.createElement("script");
      script.src = "https://app.productbridge.io/sdk/pb-widget.js";
      script.async = true;
      script.onload = () => {
        if (window.ProductBridge) {
          window.ProductBridge.init({
            organizationId: "b6336e27-6355-401a-b3ee-8b9645d9a8da",
            customTrigger: true,
            userToken: userToken || undefined,
          });
          setWidgetReady(true);
        }
      };
      script.onerror = () => {
        setWidgetError(true);
        console.warn("Failed to load ProductBridge widget");
      };
      document.head.appendChild(script);
    };

    initProductBridge();
  }, [userToken]);

  const openFeedback = () => {
    if (typeof window !== "undefined" && window.ProductBridge) {
      window.ProductBridge.toggle();
    } else if (!widgetReady) {
      // Widget not loaded yet
      console.warn("Feedback widget is still loading, please try again in a moment");
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
              disabled={!widgetReady}
              className="inline-flex items-center gap-2 px-3 py-2 hover:text-foreground transition-colors whitespace-nowrap min-h-[44px] rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Give feedback"
            >
              {widgetError ? (
                <>
                  <MessageCircle className="size-4 sm:size-3.5" /> Feedback unavailable
                </>
              ) : widgetReady ? (
                <>
                  <MessageCircle className="size-4 sm:size-3.5" /> Feedback
                </>
              ) : (
                <>
                  <Loader2 className="size-4 sm:size-3.5 animate-spin" /> Loading...
                </>
              )}
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
    </footer>
  );
}
