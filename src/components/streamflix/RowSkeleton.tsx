import { Skeleton } from "@/components/ui/skeleton";

export function RowSkeleton() {
  return (
    <section className="space-y-0 py-0 sm:space-y-0 sm:py-0">
      <Skeleton className="mb-4 sm:mb-6 px-4 sm:px-8 h-8 sm:h-9 w-52 rounded" />
      <div className="flex gap-4 sm:gap-6 overflow-hidden px-4 sm:px-8 pb-4 sm:pb-10">
        {/* Portrait movie cards - match MovieCard responsive widths */}
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className="w-[175px] sm:w-[220px] md:w-[190px] lg:w-[200px] xl:w-[210px] 2xl:w-[220px] aspect-[2/3] rounded-xl shrink-0"
          />
        ))}
        {/* Landscape/trending skeletons - match MovieCard landscape responsive widths */}
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton
            key={`landscape-${i}`}
            className="w-[280px] sm:w-[380px] md:w-[320px] lg:w-[350px] xl:w-[380px] aspect-video rounded-xl shrink-0"
          />
        ))}
      </div>
    </section>
  );
}
