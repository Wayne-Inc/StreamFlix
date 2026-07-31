import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/browse"
      className={`inline-flex items-center gap-2.5 ${className}`}
      aria-label="StreamFlix browse"
    >
      <img
        src="/icon.png"
        alt="StreamFlix"
        className="size-7 sm:size-8 rounded-lg object-cover shadow-md shadow-primary/20 ring-1 ring-white/10"
      />
      <span className="text-primary font-black tracking-tighter text-2xl sm:text-3xl select-none">
        STREAM<span className="text-foreground">FLIX</span>
      </span>
    </Link>
  );
}
