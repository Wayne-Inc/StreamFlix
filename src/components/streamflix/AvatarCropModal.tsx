import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { X } from "lucide-react";

type CropShape = "square" | "circle" | "free";

export function AvatarCropModal({
  src,
  onConfirm,
  onClose,
  showCircleGuide = false,
  cropShape = "square",
}: {
  src: string;
  onConfirm: (dataUrl: string) => void;
  onClose: () => void;
  showCircleGuide?: boolean;
  cropShape?: CropShape;
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

  // Determine the crop area aspect ratio
  const cropAspectRatio = cropShape === "free" && image
    ? image.naturalWidth / image.naturalHeight
    : 1;

  // Calculate render scale to fit image in viewport
  // For "free", we want to fit the image within the viewport maintaining the crop aspect ratio
  const renderScale = image && viewportWidth && viewportHeight
    ? Math.min(
        viewportWidth / image.naturalWidth,
        viewportHeight / image.naturalHeight
      )
    : 1;

  useEffect(() => {
    if (!image || !viewportWidth || !viewportHeight) return;
    const dispW = image.naturalWidth * renderScale;
    const dispH = image.naturalHeight * renderScale;
    // Center the image initially in the viewport
    const nx = Math.min(0, (viewportWidth - dispW) / 2);
    const ny = Math.min(0, (viewportHeight - dispH) / 2);
    offsetRef.current = { x: nx, y: ny };
    setOffset({ x: nx, y: ny });
  }, [image, viewportWidth, viewportHeight, renderScale]);

  const confirm = () => {
    if (!image || !viewportWidth || !viewportHeight) return;
    setBusy(true);
    const canvas = document.createElement("canvas");

    // Output dimensions - maintain aspect ratio, max 512px on longest side
    const MAX_OUT = 512;
    let outWidth: number;
    let outHeight: number;

    if (cropShape === "square" || cropShape === "circle") {
      outWidth = MAX_OUT;
      outHeight = MAX_OUT;
    } else if (cropShape === "free" && image) {
      const imgAspect = image.naturalWidth / image.naturalHeight;
      if (imgAspect >= 1) {
        outWidth = MAX_OUT;
        outHeight = Math.round(MAX_OUT / imgAspect);
      } else {
        outHeight = MAX_OUT;
        outWidth = Math.round(MAX_OUT * imgAspect);
      }
    } else {
      outWidth = MAX_OUT;
      outHeight = MAX_OUT;
    }

    canvas.width = outWidth;
    canvas.height = outHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setBusy(false);
      return;
    }

    // For circle crop, create a circular clipping path
    if (cropShape === "circle") {
      ctx.save();
      ctx.beginPath();
      ctx.arc(outWidth / 2, outHeight / 2, outWidth / 2, 0, Math.PI * 2);
      ctx.clip();
    }

    // Calculate source rectangle in image coordinates
    const dispW = image.naturalWidth * renderScale;
    const dispH = image.naturalHeight * renderScale;

    // The crop area IS the full viewport (since viewport matches crop aspect ratio for "free")
    const cropViewportW = viewportWidth;
    const cropViewportH = viewportHeight;

    const sx = -offset.x / renderScale;
    const sy = -offset.y / renderScale;
    const sw = cropViewportW / renderScale;
    const sh = cropViewportH / renderScale;

    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, outWidth, outHeight);

    if (cropShape === "circle") {
      ctx.restore();
    }

    onConfirm(canvas.toDataURL("image/jpeg", 0.85));
    setBusy(false);
  };

  // Determine viewport aspect ratio class
  const getViewportAspectClass = () => {
    if (cropShape === "square" || cropShape === "circle") return "aspect-square";
    if (cropShape === "free" && image) {
      const ratio = image.naturalWidth / image.naturalHeight;
      return `aspect-[${ratio}]`;
    }
    return "aspect-square";
  };

  // Determine crop guide border radius
  const getCropGuideClass = () => {
    if (cropShape === "circle") return "rounded-full";
    if (cropShape === "square") return "rounded-lg";
    return "rounded-lg";
  };

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
            // Constrain dragging so the image always covers the crop area
            const nx = Math.min(0, Math.max(viewportWidth - dispW, drag.ox + (e.clientX - drag.startX)));
            const ny = Math.min(0, Math.max(viewportHeight - dispH, drag.oy + (e.clientY - drag.startY)));
            offsetRef.current = { x: nx, y: ny };
            setOffset({ x: nx, y: ny });
          }}
          onPointerUp={() => { dragRef.current = null; }}
          onPointerCancel={() => { dragRef.current = null; }}
          className={`relative mt-4 w-full touch-none cursor-move overflow-hidden bg-neutral-900 ${getViewportAspectClass()}`}
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
          {showCircleGuide && cropShape === "circle" && (
            <div className="pointer-events-none absolute inset-0 border-2 border-white/60 rounded-full" aria-hidden="true" />
          )}
          <div className={`pointer-events-none absolute inset-0 border-2 border-white/40 ${getCropGuideClass()}`} />
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