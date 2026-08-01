import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-md bg-gradient-to-r from-primary/[0.06] via-primary/[0.18] to-primary/[0.06] bg-[length:800px_100%]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
