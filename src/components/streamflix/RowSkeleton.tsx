import { Skeleton } from "@/components/ui/skeleton";

export function RowSkeleton() {
  return (
    <div className="space-y-4 py-4">
      <Skeleton className="h-8 sm:h-9 w-52 rounded" />
      <div className="flex gap-2 sm:gap-3 overflow-hidden px-4 sm:px-8">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton
            key={i}
            className="w-[200px] sm:w-[260px] aspect-[2/3] rounded-lg shrink-0"
          />
        ))}
      </div>
    </div>
  );
}
