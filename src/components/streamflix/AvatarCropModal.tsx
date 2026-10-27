import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { X } from "lucide-react";

export function AvatarCropModal({
  src,
  onConfirm,
  onClose,
  showCircleGuide = false,
}: {
  src: string;
  onConfirm: (dataUrl: string) => void;
  onClose: () => void;
  showCircleGuide?: boolean;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImage(img);
    img.src = src;
  }, [src]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setViewportWidth(el.clientWidth);
      setViewportHeight(el.clientHeight);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Scale image to cover viewport (cover), preserving aspect ratio - viewport is always 1:1
  const renderScale = image && viewportWidth && viewportHeight
    ? Math.max(
        viewportWidth / image.naturalWidth,
        viewportHeight / image.naturalHeight
      )
    : 1;

  useEffect(() => {
    if (!image || !viewportWidth || !viewportHeight) return;
    const dispW = image.naturalWidth * renderScale;
    const dispH = image.naturalHeight * renderScale;
    // Center the image initially in the viewport
    const nx = (viewportWidth - dispW) / 2;
    const ny = (viewportHeight - dispH) / 2;
    offsetRef.current = { x: nx, y: ny };
    setOffset({ x: nx, y: ny });
  }, [image, viewportWidth, viewportHeight, renderScale]);

  const confirm = () => {
    if (!image || !viewportWidth || !viewportHeight) return;
    setBusy(true);
    const canvas = document.createElement("canvas");

    // Output square (1:1), 512x512 for avatar
    const MAX_OUT = 512;
    canvas.width = MAX_OUT;
    canvas.height = MAX_OUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setBusy(false);
      return;
    }

    // For circle guide, clip to circle
    if (showCircleGuide) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(MAX_OUT / 2, MAX_OUT / 2, MAX_OUT / 2, 0, Math.PI * 2);
      ctx.clip();
    }

    // The displayed image dimensions
    const dispW = image.naturalWidth * renderScale;
    const dispH = image.naturalHeight * renderScale;

    // The crop region is the full viewport (1:1 square)
    const cropViewportW = viewportWidth;
    const cropViewportH = viewportHeight;

    // Convert to image coordinates
    const sx = -offset.x / renderScale;
    const sy = -offset.y / renderScale;
    const sw = cropViewportW / renderScale;
    const sh = cropViewportH / renderScale;

    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, MAX_OUT, MAX_OUT);

    if (showCircleGuide) {
      ctx.restore();
    }

    onConfirm(canvas.toDataURL("image/jpeg", 0.85));
    setBusy(false);
  };

  // Viewport is always 1:1 (square) for avatar cropping
  const viewportStyle = { aspectRatio: 1 };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-md bg-card p-4 shadow-2xl max-h-[92dvh] overflow-y-auto sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Crop avatar</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div
          ref={viewportRef}
          onPointerDown={(e) => {
            const el = viewportRef.current;
            if (!el) return;
            el.setPointerCapture(e.pointerId);
            dragRef.current = {
              startX: e.clientX,
              startY: e.clientY,
              ox: offsetRef.current.x,
              oy: offsetRef.current.y,
            };
          }}
          onPointerMove={(e) => {
            const drag = dragRef.current;
            if (!drag || !image) return;
            const dispW = image.naturalWidth * renderScale;
            const dispH = image.naturalHeight * renderScale;
            // Constrain so image covers the viewport
            const nx = Math.min(0, Math.max(viewportWidth - dispW, drag.ox + (e.clientX - drag.startX)));
            const ny = Math.min(0, Math.max(viewportHeight - dispH, drag.oy + (e.clientY - drag.startY)));
            offsetRef.current = { x: nx, y: ny };
            setOffset({ x: nx, y: ny });
          }}
          onPointerUp={() => { dragRef.current = null; }}
          onPointerCancel={() => { dragRef.current = null; }}
          className="relative mt-4 w-full touch-none cursor-move overflow-hidden rounded-lg bg-neutral-900"
          style={viewportStyle}
        >
          {image && (
            <img
              src={src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute left-0 top-0 select-none"
              style={{
                width: image.naturalWidth * renderScale,
                height: image.naturalHeight * renderScale,
                transform: `translate(${offset.x}px, ${offset.y}px)`,
              }}
            />
          )}
          {showCircleGuide && (
            <div className="pointer-events-none absolute inset-0 border-2 border-white/60 rounded-full" aria-hidden="true" />
          )}
          <div className="pointer-events-none absolute inset-0 border-2 border-white/40 rounded-lg" />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded border border-border px-4 py-2 text-sm hover:bg-accent"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={!image || busy}
            className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? "Cropping…" : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}