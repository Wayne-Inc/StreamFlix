import { useState, useCallback, useEffect } from "react";
import { Share2, Copy, Check, Link2 } from "lucide-react";
import { toast } from "sonner";
import { siteUrl } from "@/lib/seo";

interface ShareButtonProps {
  title: string;
  description?: string;
  url?: string;
  image?: string;
  className?: string;
}

export function ShareButton({ 
  title, 
  description = "Watch on StreamFlix", 
  url, 
  image,
  className = ""
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [shareSupported, setShareSupported] = useState(false);

  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");

  const handleShare = useCallback(async () => {
    const shareData = {
      title,
      text: description,
      url: shareUrl,
    };

    if (navigator.share && shareSupported) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          fallbackCopy();
        }
      }
    } else {
      fallbackCopy();
    }
  }, [title, description, shareUrl, shareSupported]);

  const fallbackCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }, [shareUrl]);

  // Check if Web Share API is supported
  useEffect(() => {
    setShareSupported(navigator.share !== undefined);
  }, []);

  return (
    <div className="relative inline-flex">
      <button
        onClick={handleShare}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50",
          className
        )}
        aria-label="Share"
      >
        <Share2 className="size-4" />
        <span className="hidden sm:inline">Share</span>
      </button>
      
      {/* Native share dropdown on supported devices */}
      {shareSupported && navigator.share && (
        <button
          onClick={handleShare}
          className="absolute right-full mr-2 top-1/2 -translate-y-1/2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all"
          aria-label="Native share"
        >
          <Share2 className="size-4" />
        </button>
      )}
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// Also export a more advanced version for movie/share pages
export function MovieShareButton({ 
  movie, 
  type = "movie" 
}: { 
  movie: { 
    id: string; 
    title: string; 
    description?: string; 
    poster?: string;
    year?: number;
  };
  type?: "movie" | "tv";
}) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${siteUrl()}/${type}/${movie.id}`;
  const shareData = {
    title: `${movie.title} (${movie.year || ""}) - StreamFlix`,
    text: movie.description || `Watch ${movie.title} on StreamFlix`,
    url: shareUrl,
  };

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }
    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }, [shareData, shareUrl]);

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
      aria-label={`Share ${movie.title}`}
    >
      <Share2 className="size-4" />
      <span className="hidden sm:inline">{copied ? <Check className="size-4" /> : "Share"}</span>
    </button>
  );
}