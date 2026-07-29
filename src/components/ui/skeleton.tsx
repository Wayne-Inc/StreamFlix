import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gradient-to-r from-primary/5 via-primary/15 to-primary/5 bg-[length:800px_100%] animate-shimmer", className)}
      {...props}
    />
  );
}

export { Skeleton };
