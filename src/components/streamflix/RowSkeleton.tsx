import { Skeleton } from "@/components/ui/skeleton";

export function RowSkeleton() {
  return (
    <section className="space-y-0 py-0 sm:space-y-0 sm:py-0">
      <Skeleton className="mb-4 sm:mb-6 px-4 sm:px-8 h-8 sm:h-9 w-52 rounded" />
      <div className="flex gap-4 sm:gap-6 overflow-hidden px-4 sm:px-8 pb-4 sm:pb-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="w-[175px] sm:w-[220px] aspect-[2/3] rounded-xl shrink-0" />
        ))}
      </div>
    </section>
  );
}
