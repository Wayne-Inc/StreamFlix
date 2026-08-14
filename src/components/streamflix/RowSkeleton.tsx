import { Skeleton } from "@/components/ui/skeleton";

export function RowSkeleton() {
  return (
    <div className="py-4">
      <div className="px-4 sm:px-8">
        <Skeleton className="mb-4 sm:mb-6 h-8 sm:h-9 w-52 rounded" />
      </div>
      <div className="flex gap-4 sm:gap-6 overflow-hidden px-4 sm:px-8 pb-4 sm:pb-10">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="w-[150px] sm:w-[190px] aspect-[2/3] rounded-md shrink-0" />
        ))}
      </div>
    </div>
  );
}
