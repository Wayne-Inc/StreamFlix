import React, { useEffect, useState } from "react";
import { Minus, Square, X, Sparkles } from "lucide-react";

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      isMaximized: () => Promise<boolean>;
    };
  }
}

type AmbientColor = { r: number; g: number; b: number };

function sameColor(a: AmbientColor | null, b: AmbientColor | null) {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    Math.abs(a.r - b.r) <= 6 && Math.abs(a.g - b.g) <= 6 && Math.abs(a.b - b.b) <= 6
  );
}

function isLight({ r, g, b }: AmbientColor) {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) > 0.6;
}

export function CustomTitleBar() {
  const [isElectron, setIsElectron] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [ambient, setAmbient] = useState<AmbientColor | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.electronAPI) {
      setIsElectron(true);
      window.electronAPI.isMaximized().then(setIsMaximized);
    }
  }, []);

  useEffect(() => {
    if (!isElectron) return;
    let cancelled = false;

    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 8;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const cache = new Map<string, Promise<AmbientColor | null>>();

    const sampleSrc = (src: string): Promise<AmbientColor | null> => {
      let pending = cache.get(src);
      if (!pending) {
        pending = new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        })
          .then((img) => {
            if (!ctx) return null;
            ctx.drawImage(img, 0, 0, 8, 8);
            const data = ctx.getImageData(0, 0, 8, 8).data;
            let r = 0;
            let g = 0;
            let b = 0;
            let n = 0;
            for (let i = 0; i < data.length; i += 4) {
              if (data[i + 3] < 125) continue;
              r += data[i];
              g += data[i + 1];
              b += data[i + 2];
              n++;
            }
            return n
              ? { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) }
              : null;
          })
          .catch(() => null);
        cache.set(src, pending);
      }
      return pending;
    };

    const findBandImage = (): string | null => {
      const band = { top: 0, bottom: 130 };
      let bestSrc: string | null = null;
      let bestScore = 0;
      for (const img of Array.from(document.images)) {
        if (!img.src || img.naturalWidth < 240) continue;
        const rect = img.getBoundingClientRect();
        const overlap = Math.min(rect.bottom, band.bottom) - Math.max(rect.top, band.top);
        if (overlap <= 0) continue;
        const score = overlap * 1000 + (rect.width * rect.height) / 100;
        if (score > bestScore) {
          bestScore = score;
          bestSrc = img.src;
        }
      }
      return bestSrc;
    };

    const sampleColorsBelow = (): AmbientColor | null => {
      const width = window.innerWidth;
      const y = 46;
      const xs = [
        Math.round(width * 0.12),
        Math.round(width * 0.5),
        Math.round(width * 0.88),
      ];
      for (const x of xs) {
        const els = document.elementsFromPoint(x, y);
        for (const el of els) {
          if (el === document.body || el === document.documentElement) continue;
          const m = getComputedStyle(el).backgroundColor.match(
            /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/,
          );
          if (!m) continue;
          const a = m[4] === undefined ? 1 : parseFloat(m[4]);
          if (a < 0.2) continue;
          return { r: +m[1], g: +m[2], b: +m[3] };
        }
      }
      return null;
    };

    const tick = async () => {
      if (document.hidden) return;
      let color: AmbientColor | null = null;
      const src = findBandImage();
      if (src) color = await sampleSrc(src);
      if (!color) color = sampleColorsBelow();
      if (cancelled) return;
      setAmbient((prev) => (sameColor(prev, color) ? prev : color));
    };

    tick();
    const id = setInterval(tick, 700);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isElectron]);

  if (!isElectron) return null;

  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = async () => {
    window.electronAPI?.maximize();
    if (window.electronAPI) {
      const maximized = await window.electronAPI.isMaximized();
      setIsMaximized(maximized);
    }
  };
  const handleClose = () => window.electronAPI?.close();

  const light = ambient ? isLight(ambient) : false;
  const ambientStyle = ambient
    ? {
        background: `linear-gradient(to right, rgba(${ambient.r},${ambient.g},${ambient.b},0.72), rgba(${ambient.r},${ambient.g},${ambient.b},0.5))`,
      }
    : undefined;
  const accentGlowStyle = ambient
    ? {
        background: `linear-gradient(to right, transparent, rgba(${ambient.r},${ambient.g},${ambient.b},0.95) 50%, transparent)`,
      }
    : undefined;

  const windowBtnClass = light
    ? "size-7 rounded-lg inline-flex items-center justify-center hover:bg-black/10 text-zinc-800 hover:text-black transition-all duration-150"
    : "size-7 rounded-lg inline-flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all duration-150";

  return (
    <div
      className={`h-10 flex items-center justify-between border-b select-none px-4 fixed top-0 left-0 right-0 z-[60] backdrop-blur-2xl shadow-lg shadow-black/50 transition-colors duration-500 ${
        ambient
          ? "border-white/10"
          : "border-zinc-800/90 bg-black/95"
      }`}
      style={{ WebkitAppRegion: "drag", ...ambientStyle } as React.CSSProperties}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={
            light
              ? "text-xs font-black tracking-widest text-zinc-900"
              : "text-xs font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400"
          }
        >
          STREAMFLIX
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium tracking-wide border border-primary/20">
          <Sparkles className="size-2.5" /> Desktop
        </span>
      </div>

      <div
        className="flex items-center gap-1.5"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <button onClick={handleMinimize} className={windowBtnClass} title="Minimize">
          <Minus className="size-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className={windowBtnClass}
          title={isMaximized ? "Restore" : "Maximize"}
        >
          <Square className="size-3" />
        </button>
        <button
          onClick={handleClose}
          className="size-7 rounded-lg inline-flex items-center justify-center hover:bg-red-600 hover:text-white text-zinc-400 transition-all duration-150"
          title="Close"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Subtle bottom glowing accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent pointer-events-none"
        style={accentGlowStyle}
      />
    </div>
  );
}
