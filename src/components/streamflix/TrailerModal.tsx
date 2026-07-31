import { X } from "lucide-react";

export function TrailerModal({ url, onClose }: { url: string; onClose: () => void }) {
  const videoId = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]+)/,
  )?.[1];

  if (!videoId) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute right-3 top-3 z-20">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80"
            aria-label="Close trailer"
          >
            <X className="size-6" />
          </button>
        </div>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          className="h-[calc(100vh-4rem)] w-full max-h-[90vh]"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>
    </div>
  );
}
