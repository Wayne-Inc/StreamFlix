import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
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
  const offsetRef = useRef({ x: 0, y: 0 });
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

  const renderScale = image && size
    ? Math.max(size / image.naturalWidth, size / image.naturalHeight)
    : 1;

  useEffect(() => {
    if (!image || !size) return;
    const dispW = image.naturalWidth * renderScale;
    const dispH = image.naturalHeight * renderScale;
    const nx = Math.min(0, Math.max(size - dispW, 0));
    const ny = Math.min(0, Math.max(size - dispH, 0));
    offsetRef.current = { x: nx, y: ny };
    setOffset({ x: nx, y: ny });
  }, [image, size, renderScale]);

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
            if (!drag) return;
            const dispW = image!.naturalWidth * renderScale;
            const dispH = image!.naturalHeight * renderScale;
            const nx = Math.min(0, Math.max(size - dispW, drag.ox + (e.clientX - drag.startX)));
            const ny = Math.min(0, Math.max(size - dispH, drag.oy + (e.clientY - drag.startY)));
            offsetRef.current = { x: nx, y: ny };
            setOffset({ x: nx, y: ny });
          }}
          onPointerUp={() => { dragRef.current = null; }}
          onPointerCancel={() => { dragRef.current = null; }}
          className="relative mt-4 aspect-square w-full touch-none cursor-move overflow-hidden rounded-lg bg-neutral-900"
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
          <div className="pointer-events-none absolute inset-0 border-2 border-white/40" />
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
