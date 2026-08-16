import React, { useEffect, useState } from "react";
import { Minus, Square, X, Sparkles } from "lucide-react";

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      isMaximized: () => Promise<boolean>;
      getOnlineStatus: () => Promise<boolean>;
      retryLoad: () => Promise<boolean>;
      getVersion: () => Promise<string>;
      checkForUpdates: () => Promise<{ state: string; message: string }>;
      installUpdate: () => Promise<boolean>;
      onUpdaterStatus: (cb: (status: UpdateStatus) => void) => () => void;
    };
  }
}

export type UpdateStatus = {
  state: string;
  message: string;
  percent?: number;
};

export function CustomTitleBar() {
  const [isElectron, setIsElectron] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.electronAPI) {
      setIsElectron(true);
      window.electronAPI.isMaximized().then(setIsMaximized);
    }
  }, []);

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

  return (
    <div
      className="h-10 bg-black/95 border-b border-zinc-800/90 flex items-center justify-between select-none px-4 fixed top-0 left-0 right-0 z-[60] backdrop-blur-xl shadow-lg shadow-black/50"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-xs font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
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
        <button
          onClick={handleMinimize}
          className="size-7 rounded-lg inline-flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all duration-150"
          title="Minimize"
        >
          <Minus className="size-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="size-7 rounded-lg inline-flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all duration-150"
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
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent pointer-events-none" />
    </div>
  );
}
