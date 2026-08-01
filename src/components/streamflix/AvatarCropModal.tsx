import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export function AvatarCropModal({
  src,
  onConfirm,
  onClose,
}: {
  src: string;
  onConfirm: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [size, setSize] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImage(img);
    img.src = src;
  }, [src]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = zoom;
  const minScale =
    image && size ? Math.max(size / image.naturalWidth, size / image.naturalHeight) : 1;
  const renderScale = minScale * scale;

  useEffect(() => {
    if (!image || !size) return;
    const dispW = image.naturalWidth * renderScale;
    const dispH = image.naturalHeight * renderScale;
    setOffset((o) => ({
      x: Math.min(0, Math.max(size - dispW, o.x)),
      y: Math.min(0, Math.max(size - dispH, o.y)),
    }));
  }, [image, size, renderScale]);

  const handleZoom = (z: number) => {
    if (!image || !size) return;
    const newScale = minScale * z;
    const dispW = image.naturalWidth * newScale;
    const dispH = image.naturalHeight * newScale;
    setZoom(z);
    setOffset({
      x: (size - dispW) / 2,
      y: (size - dispH) / 2,
    });
  };

  const confirm = () => {
    if (!image || !size) return;
    setBusy(true);
    const canvas = document.createElement("canvas");
    const out = 256;
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setBusy(false);
      return;
    }
    const sx = -offset.x / renderScale;
    const sy = -offset.y / renderScale;
    const sw = size / renderScale;
    const sh = size / renderScale;
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, out, out);
    onConfirm(canvas.toDataURL("image/jpeg", 0.85));
    setBusy(false);
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
          className="relative mt-4 aspect-square w-full overflow-hidden rounded-lg bg-neutral-900"
        >
          {image && (
            <img
              src={src}
              alt=""
              draggable={false}
              onPointerDown={(e) => {
                const el = viewportRef.current;
                if (!el) return;
                el.setPointerCapture(e.pointerId);
                dragRef.current = {
                  startX: e.clientX,
                  startY: e.clientY,
                  ox: offset.x,
                  oy: offset.y,
                };
              }}
              onPointerMove={(e) => {
                const drag = dragRef.current;
                if (!drag) return;
                const dispW = image.naturalWidth * renderScale;
                const dispH = image.naturalHeight * renderScale;
                setOffset({
                  x: Math.min(0, Math.max(size - dispW, drag.ox + (e.clientX - drag.startX))),
                  y: Math.min(0, Math.max(size - dispH, drag.oy + (e.clientY - drag.startY))),
                });
              }}
              onPointerUp={() => {
                dragRef.current = null;
              }}
              onPointerCancel={() => {
                dragRef.current = null;
              }}
              className="pointer-events-none absolute left-0 top-0 cursor-move select-none"
              style={{
                width: image.naturalWidth * renderScale,
                height: image.naturalHeight * renderScale,
                transform: `translate(${offset.x}px, ${offset.y}px)`,
              }}
            />
          )}
          <div className="pointer-events-none absolute inset-0 border-2 border-white/40" />
        </div>

        <div className="mt-4">
          <label className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => handleZoom(parseFloat(e.target.value))}
              className="flex-1"
            />
          </label>
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
