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
  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null);
  const pointersRef = useRef<Map<number, { cx: number; cy: number }>>(new Map());
  const zoomRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
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
    setOffset((o) => {
      const nx = Math.min(0, Math.max(size - dispW, o.x));
      const ny = Math.min(0, Math.max(size - dispH, o.y));
      offsetRef.current = { x: nx, y: ny };
      return { x: nx, y: ny };
    });
  }, [image, size, renderScale]);

  const handleZoom = (z: number) => {
    if (!image || !size) return;
    const newScale = minScale * z;
    const dispW = image.naturalWidth * newScale;
    const dispH = image.naturalHeight * newScale;
    const o = {
      x: (size - dispW) / 2,
      y: (size - dispH) / 2,
    };
    zoomRef.current = z;
    offsetRef.current = o;
    setZoom(z);
    setOffset(o);
  };

  const endPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 1) {
      const [p] = [...pointersRef.current.values()];
      dragRef.current = {
        startX: p.cx,
        startY: p.cy,
        ox: offsetRef.current.x,
        oy: offsetRef.current.y,
      };
    } else if (pointersRef.current.size === 0) {
      dragRef.current = null;
    }
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
          onPointerDown={(e) => {
            const el = viewportRef.current;
            if (!image || !el) return;
            el.setPointerCapture(e.pointerId);
            pointersRef.current.set(e.pointerId, { cx: e.clientX, cy: e.clientY });

            if (pointersRef.current.size === 2) {
              dragRef.current = null;
              const pts = [...pointersRef.current.values()];
              pinchRef.current = {
                startDist: Math.max(1, Math.hypot(pts[0].cx - pts[1].cx, pts[0].cy - pts[1].cy)),
                startZoom: zoomRef.current,
              };
            } else {
              dragRef.current = {
                startX: e.clientX,
                startY: e.clientY,
                ox: offsetRef.current.x,
                oy: offsetRef.current.y,
              };
            }
          }}
          onPointerMove={(e) => {
            const el = viewportRef.current;
            if (!image || !el) return;
            const p = pointersRef.current.get(e.pointerId);
            if (p) {
              p.cx = e.clientX;
              p.cy = e.clientY;
            }

            if (pointersRef.current.size >= 2 && pinchRef.current) {
              const rect = el.getBoundingClientRect();
              const pts = [...pointersRef.current.values()];
              const dist = Math.max(1, Math.hypot(pts[0].cx - pts[1].cx, pts[0].cy - pts[1].cy));
              const newZoom = Math.min(
                3,
                Math.max(1, pinchRef.current.startZoom * (dist / pinchRef.current.startDist)),
              );
              const newScale = minScale * newZoom;
              const newDispW = image.naturalWidth * newScale;
              const newDispH = image.naturalHeight * newScale;
              const fx = (pts[0].cx + pts[1].cx) / 2 - rect.left;
              const fy = (pts[0].cy + pts[1].cy) / 2 - rect.top;
              const curScale = minScale * zoomRef.current;
              const curDispW = image.naturalWidth * curScale;
              const curDispH = image.naturalHeight * curScale;
              const imgFx = curDispW > 0 ? (fx - offsetRef.current.x) / curDispW : 0;
              const imgFy = curDispH > 0 ? (fy - offsetRef.current.y) / curDispH : 0;
              const nx = Math.min(0, Math.max(size - newDispW, fx - imgFx * newDispW));
              const ny = Math.min(0, Math.max(size - newDispH, fy - imgFy * newDispH));
              zoomRef.current = newZoom;
              offsetRef.current = { x: nx, y: ny };
              setZoom(newZoom);
              setOffset({ x: nx, y: ny });
              return;
            }

            const drag = dragRef.current;
            if (!drag) return;
            const dispW = image.naturalWidth * renderScale;
            const dispH = image.naturalHeight * renderScale;
            const nx = Math.min(0, Math.max(size - dispW, drag.ox + (e.clientX - drag.startX)));
            const ny = Math.min(0, Math.max(size - dispH, drag.oy + (e.clientY - drag.startY)));
            offsetRef.current = { x: nx, y: ny };
            setOffset({ x: nx, y: ny });
          }}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
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

        <div className="mt-4 hidden sm:block">
          <label className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => handleZoom(parseFloat(e.target.value))}
              onPointerDown={(e) => {
                const el = e.currentTarget;
                const rect = el.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                handleZoom(Math.min(3, Math.max(1, 1 + x * 2)));
              }}
              className="zoom-slider flex-1"
              style={{ ["--fill" as string]: `${((zoom - 1) / 2) * 100}%` } as React.CSSProperties}
            />
            <span className="w-11 shrink-0 text-right tabular-nums">{Math.round(zoom * 100)}%</span>
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
