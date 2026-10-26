import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
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

/**
 * Movie card skeleton - matches MovieCard component responsive sizes
 * Portrait (default) and landscape variants
 */
export function MovieCardSkeleton({
  landscape = false,
  fluid = false,
}: { landscape?: boolean; fluid?: boolean } = {}) {
  if (fluid) {
    return (
      <div className="group relative w-full shrink-0">
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-surface">
          <Skeleton className="size-full" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-black/70 backdrop-blur-lg px-2 py-1 border border-yellow-400/30">
            <Skeleton className="size-3.5 rounded-full" />
            <Skeleton className="h-3 w-8 rounded" />
          </div>
          <div className="absolute inset-x-0 bottom-0 p-3">
            <Skeleton className="h-4 w-3/4 rounded mb-2" />
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-3 w-12 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`group relative ${landscape
      ? "w-[280px] sm:w-[380px] md:w-[320px] lg:w-[350px] xl:w-[380px] shrink-0"
      : "w-[175px] sm:w-[220px] md:w-[190px] lg:w-[200px] xl:w-[210px] 2xl:w-[220px] shrink-0"
    }`}>
      <div className={`relative ${landscape ? "aspect-video" : "aspect-[2/3]"} overflow-hidden rounded-xl bg-surface`}>
        <Skeleton className="size-full" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-black/70 backdrop-blur-lg px-2 py-1 border border-yellow-400/30">
          <Skeleton className="size-3.5 rounded-full" />
          <Skeleton className="h-3 w-8 rounded" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-3">
          <Skeleton className="h-4 w-3/4 rounded mb-2" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-3 w-12 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hero banner skeleton - matches HeroBanner component
 * Responsive breakpoints: aspect-[4/5] sm:aspect-[16/9]
 * Heights: max-h-[95vh] min-h-[60vh] sm:min-h-[50vh] sm:min-h-[400px] lg:min-h-[550px]
 */
export function HeroBannerSkeleton() {
  return (
    <section
      className="relative w-full overflow-hidden aspect-[4/5] sm:aspect-[16/9] max-h-[95vh] min-h-[60vh] sm:min-h-[50vh] sm:min-h-[400px] lg:min-h-[550px]"
    >
      <Skeleton className="absolute inset-0 size-full rounded-none bg-surface/60 animate-ken-burns" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/70 to-transparent md:h-72" />

      <div className="relative z-10 flex h-full items-end justify-center px-4 pb-6 pt-8 text-center sm:pb-8 sm:pt-10 sm:px-8 md:items-end md:justify-start">
        {/* Bottom gradient for text contrast */}
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-background/95 via-background/40 to-transparent z-0 pointer-events-none" />

        <div className="animate-fade-in w-full max-w-none space-y-2 sm:space-y-3 text-center md:max-w-3xl md:text-left">
          {/* Title/Logo area */}
          <Skeleton className="mb-2 sm:mb-4 mx-auto md:mx-0 h-8 w-56 max-w-full rounded-md sm:h-10 sm:w-64 lg:h-12 lg:w-72" />

          {/* Genre chips */}
          <div className="mb-1.5 sm:mb-2 flex flex-wrap items-center justify-center md:justify-start gap-1.5">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>

          {/* Meta badges: year, rating, runtime */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-sm md:justify-start md:text-sm">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>

          {/* Description - hidden on mobile, visible on md+ */}
          <Skeleton className="hidden md:block mx-auto md:mx-0 h-4 w-full max-w-xl rounded lg:h-5" />
          <Skeleton className="hidden md:block mx-auto md:mx-0 h-4 w-full max-w-xl rounded lg:h-5" />
          <Skeleton className="hidden md:block mx-auto md:mx-0 h-4 w-2/3 max-w-xl rounded lg:h-5" />

          {/* Action buttons */}
          <div className="mx-auto md:mx-0 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto md:justify-start px-4 sm:px-0">
            <Skeleton className="h-10 w-28 rounded-md sm:h-11 sm:w-32 lg:h-12 lg:w-36" />
            <Skeleton className="h-10 w-28 rounded-md sm:h-11 sm:w-36 lg:h-12 lg:w-40" />
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-3 inset-x-0 z-10 flex items-center justify-center gap-2 sm:justify-end sm:right-8 sm:inset-x-auto">
        <Skeleton className="w-8 h-2 rounded-full" />
        <Skeleton className="w-2 h-2 rounded-full" />
        <Skeleton className="w-2 h-2 rounded-full" />
        <Skeleton className="w-2 h-2 rounded-full" />
        <Skeleton className="w-2 h-2 rounded-full" />
      </div>
    </section>
  );
}

/**
 * Season episode picker skeleton - matches SeasonEpisodePicker component
 */
export function SeasonEpisodePickerSkeleton({
  episodeCount = 6,
}: { episodeCount?: number } = {}) {
  return (
    <div>
      <Skeleton className="mb-2 h-3 w-20 rounded" />
      <div className="flex flex-wrap gap-1.5 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-7 w-8 rounded-md" />
        ))}
      </div>
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-7 w-24 rounded-md" />
      </div>
      <div className="space-y-1.5">
        {Array.from({ length: episodeCount }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-md" />
        ))}
      </div>
    </div>
  );
}

/**
 * Settings section skeleton - matches generic SettingsPage section layout
 * Used for Profile, Security, Accessibility, Interests, Notifications, Sign Out, Export Data, Delete Account
 */
export function SettingsSectionSkeleton() {
  return (
    <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6 animate-pulse">
      {/* Section header: icon + title */}
      <div className="flex items-center gap-2">
        <Skeleton className="size-4" />
        <Skeleton className="h-5 w-24 rounded" />
      </div>
      {/* Section description */}
      <Skeleton className="mt-1 h-3 w-48 rounded" />
      {/* Section content - generic form field layout */}
      <div className="mt-4 flex flex-col sm:flex-row gap-6">
        {/* Left side - avatar/profile image placeholder */}
        <div className="flex flex-col items-center gap-3 sm:w-32 shrink-0">
          <Skeleton className="size-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        {/* Right side - form fields grid */}
        <div className="flex-1 grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={i === 5 ? "sm:col-span-2" : ""}>
              <Skeleton className="h-3 w-20 mb-1 rounded" /> {/* Label */}
              <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
            </div>
          ))}
        </div>
      </div>
      {/* Save button at bottom */}
      <div className="mt-6 flex justify-end">
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
    </section>
  );
}

/**
 * Profile section skeleton - matches Profile section with avatar upload and Save button
 */
export function ProfileSettingsSkeleton() {
  return (
    <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6 animate-pulse">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Skeleton className="size-4" />
        <Skeleton className="h-5 w-20 rounded" />
      </div>
      <Skeleton className="mt-1 h-3 w-56 rounded" />

      {/* Avatar upload area + form fields */}
      <div className="mt-4 flex flex-col sm:flex-row gap-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 sm:w-32 shrink-0">
          <Skeleton className="size-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-md" /> {/* Upload button */}
        </div>
        {/* Form fields */}
        <div className="flex-1 grid gap-4 sm:grid-cols-2">
          <div>
            <Skeleton className="h-3 w-16 mb-1 rounded" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div>
            <Skeleton className="h-3 w-20 mb-1 rounded" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div>
            <Skeleton className="h-3 w-24 mb-1 rounded" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="sm:col-span-2">
            <Skeleton className="h-3 w-24 mb-1 rounded" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="sm:col-span-2">
            <Skeleton className="h-3 w-20 mb-1 rounded" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      </div>

      {/* Color picker row */}
      <div className="mt-4 flex items-center gap-2">
        <Skeleton className="h-3 w-20 mb-1 rounded" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="size-10 rounded-full" />
          ))}
        </div>
      </div>

      {/* Toggle row (Kids profile) */}
      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="mt-0.5 h-3 w-32 rounded" />
        </div>
        <Skeleton className="h-6 w-11 rounded-full border-2 shrink-0" />
      </div>

      {/* Save button */}
      <div className="mt-6 flex justify-end">
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
    </section>
  );
}

/**
 * Security section skeleton - matches Security section with password fields and Save button
 */
export function SecuritySettingsSkeleton() {
  return (
    <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6 animate-pulse">
      <div className="flex items-center gap-2">
        <Skeleton className="size-4" />
        <Skeleton className="h-5 w-20 rounded" />
      </div>
      <Skeleton className="mt-1 h-3 w-56 rounded" />

      {/* Password fields */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Skeleton className="h-3 w-20 mb-1 rounded" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <div>
          <Skeleton className="h-3 w-24 mb-1 rounded" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <div className="sm:col-span-2">
          <Skeleton className="h-3 w-24 mb-1 rounded" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>

      {/* 2FA row */}
      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="mt-0.5 h-3 w-40 rounded" />
        </div>
        <Skeleton className="h-6 w-11 rounded-full border-2 shrink-0" />
      </div>

      {/* Save button */}
      <div className="mt-6 flex justify-end">
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
    </section>
  );
}

/**
 * Accessibility section skeleton - matches Accessibility section with toggles and Save button
 */
export function AccessibilitySettingsSkeleton() {
  return (
    <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6 animate-pulse">
      <div className="flex items-center gap-2">
        <Skeleton className="size-4" />
        <Skeleton className="h-5 w-28 rounded" />
      </div>
      <Skeleton className="mt-1 h-3 w-60 rounded" />

      {/* Reduce motion toggle */}
      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <Skeleton className="h-3 w-28 rounded" />
          <Skeleton className="mt-0.5 h-3 w-48 rounded" />
        </div>
        <Skeleton className="h-6 w-11 rounded-full border-2 shrink-0" />
      </div>

      {/* High contrast toggle */}
      <div className="mt-3 flex items-center justify-between gap-4">
        <div>
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="mt-0.5 h-3 w-48 rounded" />
        </div>
        <Skeleton className="h-6 w-11 rounded-full border-2 shrink-0" />
      </div>

      {/* Save button */}
      <div className="mt-6 flex justify-end">
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
    </section>
  );
}

/**
 * Devices section skeleton - matches Devices section with device list and Remove buttons
 */
export function DevicesSettingsSkeleton({ deviceCount = 3 }: { deviceCount?: number } = {}) {
  return (
    <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6 animate-pulse">
      <div className="flex items-center gap-2">
        <Skeleton className="size-4" />
        <Skeleton className="h-5 w-20 rounded" />
      </div>
      <Skeleton className="mt-1 h-3 w-56 rounded" />

      {/* Device list */}
      <div className="mt-4 space-y-3">
        {Array.from({ length: deviceCount }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4">
            <Skeleton className="size-10 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-4 w-32 rounded" />
                {i === 0 && <Skeleton className="h-4 w-20 rounded-full" />}
              </div>
              <Skeleton className="mt-0.5 h-3 w-40 rounded" />
            </div>
            <Skeleton className="h-8 w-20 rounded-md shrink-0" /> {/* Remove button */}
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Interests section skeleton - matches Interests section with genre chips and Save button
 */
export function InterestsSettingsSkeleton() {
  return (
    <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6 animate-pulse">
      <div className="flex items-center gap-2">
        <Skeleton className="size-4" />
        <Skeleton className="h-5 w-20 rounded" />
      </div>
      <Skeleton className="mt-1 h-3 w-64 rounded" />

      {/* Genre chips grid */}
      <div className="mt-4 flex flex-wrap gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>

      {/* Save button */}
      <div className="mt-6 flex justify-end">
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
    </section>
  );
}

/**
 * Notifications section skeleton - matches Notifications section with Enable button and toggle
 */
export function NotificationsSettingsSkeleton() {
  return (
    <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6 animate-pulse">
      <div className="flex items-center gap-2">
        <Skeleton className="size-4" />
        <Skeleton className="h-5 w-28 rounded" />
      </div>
      <Skeleton className="mt-1 h-3 w-64 rounded" />

      {/* Permission status badge */}
      <Skeleton className="mt-4 h-8 w-24 rounded-md" />

      {/* Enable Notifications button */}
      <div className="mt-4">
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>

      {/* Upcoming Movie Notifications toggle */}
      <div className="mt-4 flex items-center justify-between gap-4 rounded-md border border-border bg-background/60 px-4 py-3">
        <div>
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="mt-0.5 h-3 w-48 rounded" />
        </div>
        <Skeleton className="h-6 w-11 rounded-full border-2 shrink-0" />
      </div>
    </section>
  );
}

/**
 * Sign Out section skeleton - matches Sign Out section with Sign out button
 */
export function SignOutSettingsSkeleton() {
  return (
    <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Skeleton className="size-4" />
            <Skeleton className="h-5 w-20 rounded" />
          </div>
          <Skeleton className="mt-1 h-3 w-40 rounded" />
        </div>
        <Skeleton className="h-10 w-28 rounded-md shrink-0" />
      </div>
    </section>
  );
}

/**
 * Export Data section skeleton - matches Export Data section with Export button
 */
export function ExportDataSettingsSkeleton() {
  return (
    <section className="mt-6 rounded-lg border border-border bg-card/40 p-4 sm:p-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Skeleton className="size-4" />
            <Skeleton className="h-5 w-28 rounded" />
          </div>
          <Skeleton className="mt-1 h-3 w-56 rounded" />
        </div>
        <Skeleton className="h-10 w-28 rounded-md shrink-0" />
      </div>
    </section>
  );
}

/**
 * Delete Account section skeleton - matches Delete Account section with Delete button
 */
export function DeleteAccountSettingsSkeleton() {
  return (
    <section className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:p-6 animate-pulse">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-4 w-24 rounded text-destructive" />
          <Skeleton className="mt-1 h-3 w-56 rounded" />
        </div>
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
    </section>
  );
}

/**
 * Device list item skeleton - matches Devices section device rows
 */
export function DeviceListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4 animate-pulse">
      <Skeleton className="size-10 shrink-0 rounded-md" /> {/* Device icon */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-4 w-32 rounded" /> {/* Device label */}
          <Skeleton className="h-4 w-20 rounded-full" /> {/* "This device" badge */}
        </div>
        <Skeleton className="mt-0.5 h-3 w-40 rounded" /> {/* IP + last active */}
      </div>
      <Skeleton className="h-8 w-20 rounded-md shrink-0" /> {/* Remove button */}
    </div>
  );
}

/**
 * History item skeleton - matches HistoryPage items
 */
export function HistoryItemSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  );
}

/**
 * Profile skeleton - matches ProfilesPage "Who's watching?" layout
 * Full-screen background with profile avatar grid
 */
export function ProfileSkeleton() {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-background">
      {/* Background slides with gradient overlay */}
      <div className="absolute inset-0">
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            className="absolute inset-0 size-full object-cover bg-surface/30"
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background" />
      </div>

      {/* Header with logo placeholder */}
      <header className="absolute inset-x-0 top-0 px-4 sm:px-12 py-5 z-10 flex items-center justify-between">
        <Skeleton className="h-8 w-32 rounded" />
        <Skeleton className="size-10 rounded-lg" />
      </header>

      {/* Legal banner placeholder */}
      <Skeleton className="absolute inset-x-0 top-14 h-4 sm:top-20" />

      {/* Main content */}
      <div className="relative z-20 w-full max-w-4xl px-4 text-center">
        {/* Title: "Who's watching?" */}
        <Skeleton className="mx-auto h-10 w-48 rounded sm:h-14 sm:w-64" />

        {/* Profile grid - 5 profile cards + add button */}
        <div className="mt-8 flex flex-wrap justify-center gap-3 sm:mt-10 sm:gap-8">
          {/* 5 profile skeleton cards */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              {/* Avatar circle */}
              <div className="relative size-28 overflow-hidden rounded-lg bg-gradient-to-br from-primary/30 to-primary/60 sm:size-32">
                <Skeleton className="absolute inset-0 size-full" />
                {/* PIN lock indicator */}
                {i === 2 && (
                  <Skeleton className="absolute bottom-1 right-1 size-5 rounded-full" />
                )}
              </div>
              {/* Profile name */}
              <Skeleton className="h-4 w-24 rounded sm:w-28" />
              {/* Kids badge (on some profiles) */}
              {i === 1 && (
                <Skeleton className="h-4 w-16 rounded-full" />
              )}
            </div>
          ))}
          {/* Add Profile button */}
          <div className="flex flex-col items-center gap-3">
            <div className="grid size-28 place-items-center rounded-lg border border-dashed border-border sm:size-32">
              <Skeleton className="size-8 rounded" />
            </div>
            <Skeleton className="h-4 w-24 rounded" />
          </div>
        </div>

        {/* Manage Profiles button */}
        <Skeleton className="mx-auto mt-8 h-10 w-40 rounded border sm:mt-12" />
      </div>
    </div>
  );
}

/**
 * Continue watching skeleton - matches ContinueWatching row
 */
export function ContinueWatchingSkeleton({ count = 5 }: { count?: number } = {}) {
  return (
    <section className="relative space-y-0 py-0 sm:space-y-0 sm:py-0">
      <Skeleton className="px-4 sm:px-8 mb-4 sm:mb-6 h-8 sm:h-9 w-52 rounded" />
      <div className="relative">
        <div className="scrollbar-thin flex min-w-0 gap-4 overflow-x-auto overscroll-x-contain scroll-smooth px-4 sm:gap-6 sm:px-8 pb-4 sm:pb-10">
          {Array.from({ length: count }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * My List skeleton - matches MyListPage grid
 */
export function MyListSkeleton({ count = 12 }: { count?: number } = {}) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Calendar skeleton - matches CalendarPage
 */
export function CalendarSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-6xl px-4 pt-24 pb-16 sm:px-8">
        <Skeleton className="h-10 w-72 rounded" />
        <Skeleton className="mt-2 h-4 w-52 rounded" />
        <div className="mt-8 rounded-lg bg-surface/40 p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <Skeleton key={d} className="h-6 w-full rounded text-center" />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 42 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded bg-surface/60" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Search results skeleton - grid of movie cards
 */
export function SearchResultsSkeleton({ count = 12 }: { count?: number } = {}) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Explore genre chips skeleton
 */
export function ExploreGenreChipsSkeleton({ count = 12 }: { count?: number } = {}) {
  return (
    <div className="mt-8 flex flex-wrap gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-24 rounded-full" />
      ))}
    </div>
  );
}

/**
 * Browse page skeleton - combines hero + continue watching + rows
 */
export function BrowseSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="relative z-10 space-y-6 md:mt-12 md:space-y-12">
        <ContinueWatchingSkeleton count={5} />
        {[1, 2, 3, 4, 5].map((i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Explore page skeleton - hero + genre chips + rows
 */
export function ExploreSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-[1800px] px-4 pb-16 md:pb-20 sm:px-8">
        <ExploreGenreChipsSkeleton count={12} />
        <div className="mt-10 space-y-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Explore genre page skeleton - hero + genre chips + grid
 */
export function ExploreGenreSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-[1800px] px-4 pb-16 md:pb-20 sm:px-8">
        <ExploreGenreChipsSkeleton count={10} />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {Array.from({ length: 12 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Movie detail page skeleton - matches MoviePage
 */
export function MovieDetailSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <section className="relative min-h-[70vh] pt-16 md:min-h-[85vh] md:pt-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[52vh] overflow-hidden sm:h-[58vh] md:inset-y-0 md:h-auto">
          <Skeleton className="absolute inset-0 size-full rounded-none bg-surface/60" />
        </div>
        <div className="relative z-10 w-full min-w-0 px-4 py-10 sm:px-8 md:px-12 md:py-16 lg:px-16">
          <Skeleton className="mb-6 h-9 w-28 rounded-full" />
          <div className="grid w-full min-w-0 gap-10 md:grid-cols-3 md:items-center md:gap-8">
            <div className="min-w-0 space-y-4 md:col-span-2">
              <Skeleton className="mb-4 h-16 w-72 max-w-full rounded-md sm:h-20 md:h-24 md:w-80" />
              <div className="flex flex-wrap items-center gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-24 rounded-full sm:h-8 sm:w-28" />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-20 rounded-full" />
                ))}
              </div>
              <div className="min-w-0">
                <Skeleton className="h-4 w-full max-w-xl rounded sm:h-5" />
                <Skeleton className="mt-2 h-4 w-full max-w-xl rounded sm:h-5" />
                <Skeleton className="mt-2 h-4 w-2/3 max-w-xl rounded sm:h-5" />
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2 sm:gap-3">
                <Skeleton className="h-10 w-28 rounded-md sm:h-12 sm:w-32" />
                <Skeleton className="h-10 w-28 rounded-md sm:h-12 sm:w-36" />
                <Skeleton className="h-10 w-28 rounded-md sm:h-12 sm:w-32" />
                <Skeleton className="size-11 rounded-full sm:size-12" />
                <Skeleton className="size-11 rounded-full sm:size-12" />
              </div>
              <div className="min-w-0 pt-4">
                <Skeleton className="mb-3 h-5 w-16 rounded" />
                <div className="flex gap-3 overflow-hidden py-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="w-20 shrink-0 aspect-square rounded-xl sm:w-24" />
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden min-w-0 md:col-span-1 md:block">
              <Skeleton className="w-full max-w-80 aspect-[2/3] rounded-xl" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Person detail page skeleton
 */
export function PersonDetailSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-6xl px-4 pt-28 pb-16 sm:px-8 animate-pulse space-y-6">
        <div className="mb-4">
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-10">
          <Skeleton className="size-48 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-10 w-64 rounded" />
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-20 w-full rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Row skeleton - for browse/explore rows with mixed portrait/landscape cards
 */
export function RowSkeleton() {
  return (
    <section className="space-y-0 py-0 sm:space-y-0 sm:py-0">
      <Skeleton className="mb-4 sm:mb-6 px-4 sm:px-8 h-8 sm:h-9 w-52 rounded" />
      <div className="flex gap-4 sm:gap-6 overflow-hidden px-4 sm:px-8 pb-4 sm:pb-10">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className="w-[175px] sm:w-[220px] md:w-[190px] lg:w-[200px] xl:w-[210px] 2xl:w-[220px] aspect-[2/3] rounded-xl shrink-0"
          />
        ))}
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

export { Skeleton };