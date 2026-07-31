import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/browse"
      className={`inline-flex items-center gap-2.5 ${className}`}
      aria-label="StreamFlix browse"
    >
      <span className="text-primary font-black tracking-tighter text-2xl sm:text-3xl select-none">
        STREAM<span className="text-foreground">FLIX</span>
      </span>
    </Link>
  );
}
