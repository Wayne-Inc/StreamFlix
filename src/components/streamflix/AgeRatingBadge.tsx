import { cn } from "@/lib/utils";

const RATING_STYLES: Record<string, string> = {
  G: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "TV-G": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  PG: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  "TV-PG": "bg-sky-500/20 text-sky-400 border-sky-500/30",
  "PG-13": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "TV-14": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  R: "bg-red-500/20 text-red-400 border-red-500/30",
  "TV-MA": "bg-red-500/20 text-red-400 border-red-500/30",
  "NC-17": "bg-red-500/20 text-red-400 border-red-500/30",
};

const DEFAULT_STYLE = "bg-muted text-muted-foreground border-border";

export function AgeRatingBadge({ rating, className }: { rating: string; className?: string }) {
  const style = RATING_STYLES[rating.toUpperCase()] ?? DEFAULT_STYLE;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-semibold",
        style,
        className,
      )}
    >
      {rating}
    </span>
  );
}
