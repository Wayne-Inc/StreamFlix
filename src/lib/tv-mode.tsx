import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// Extend Navigator for TV detection
declare global {
  interface Navigator {
    connection?: {
      saveData?: boolean;
      effectiveType?: string;
      addEventListener?: (type: string, listener: EventListener) => void;
      removeEventListener?: (type: string, listener: EventListener) => void;
    };
  }
}

type TVModeCtx = {
  isTV: boolean;
  isSpatialNavEnabled: boolean;
  setSpatialNavEnabled: (v: boolean) => void;
};

const Ctx = createContext<TVModeCtx>({
  isTV: false,
  isSpatialNavEnabled: false,
  setSpatialNavEnabled: () => {},
});

function detectTV(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  // Common TV device user agents
  return (
    /SMART-TV|SmartTV|TV\s|Television|NetCast|HbbTV|Opera TV|TVBrowser|BRAVIA|GoogleTV|AppleTV|Fire TV|Roku|Tizen|webOS/.test(
      ua,
    ) ||
    /Android.*TV|Android.*FireTV/.test(ua) ||
    window.matchMedia("(pointer: coarse)").matches && window.matchMedia("(hover: none)").matches
  );
}

export function TVModeProvider({ children }: { children: ReactNode }) {
  const [isTV] = useState<boolean>(() => detectTV());
  const [isSpatialNavEnabled, setSpatialNavEnabledState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const stored = localStorage.getItem("sf:spatialNav");
      if (stored === "1") return true;
      if (stored === "0") return false;
      // Auto-enable on TV devices
      return isTV;
    } catch {
      return isTV;
    }
  });

  const setSpatialNavEnabled = (v: boolean) => {
    setSpatialNavEnabledState(v);
    try {
      localStorage.setItem("sf:spatialNav", v ? "1" : "0");
    } catch {}
  };

  // Apply spatial navigation class to document
  useEffect(() => {
    const root = document.documentElement;
    if (isSpatialNavEnabled) {
      root.classList.add("spatial-nav");
    } else {
      root.classList.remove("spatial-nav");
    }
  }, [isSpatialNavEnabled]);

  return (
    <Ctx.Provider value={{ isTV, isSpatialNavEnabled, setSpatialNavEnabled }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTVMode() {
  return useContext(Ctx);
}

// Spatial navigation helpers
export function focusableSelector(): string {
  return 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])';
}

export function getFocusableElements(container: HTMLElement = document.body): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector())).filter(
    (el) => el.offsetWidth > 0 && el.offsetHeight > 0 && getComputedStyle(el).visibility !== "hidden",
  );
}

export function navigateSpatial(direction: "up" | "down" | "left" | "right"): boolean {
  const active = document.activeElement as HTMLElement;
  if (!active) return false;

  const focusables = getFocusableElements();
  if (focusables.length === 0) return false;

  const currentIndex = focusables.indexOf(active);
  if (currentIndex === -1) {
    focusables[0].focus();
    return true;
  }

  // Simple grid-based spatial navigation
  const rect = active.getBoundingClientRect();
  let bestCandidate: HTMLElement | null = null;
  let bestScore = Infinity;

  for (const el of focusables) {
    if (el === active) continue;
    const elRect = el.getBoundingClientRect();

    let score = 0;
    let aligned = false;

    switch (direction) {
      case "down":
        if (elRect.top >= rect.bottom - 5) {
          aligned = true;
          score = Math.abs(elRect.left + elRect.width / 2 - (rect.left + rect.width / 2)) + (elRect.top - rect.bottom);
        }
        break;
      case "up":
        if (elRect.bottom <= rect.top + 5) {
          aligned = true;
          score = Math.abs(elRect.left + elRect.width / 2 - (rect.left + rect.width / 2)) + (rect.top - elRect.bottom);
        }
        break;
      case "right":
        if (elRect.left >= rect.right - 5) {
          aligned = true;
          score = Math.abs(elRect.top + elRect.height / 2 - (rect.top + rect.height / 2)) + (elRect.left - rect.right);
        }
        break;
      case "left":
        if (elRect.right <= rect.left + 5) {
          aligned = true;
          score = Math.abs(elRect.top + elRect.height / 2 - (rect.top + rect.height / 2)) + (rect.left - elRect.right);
        }
        break;
    }

    if (aligned && score < bestScore) {
      bestScore = score;
      bestCandidate = el;
    }
  }

  if (bestCandidate) {
    bestCandidate.focus();
    return true;
  }

  return false;
}

// Keyboard handler for spatial navigation
export function handleSpatialKeydown(event: KeyboardEvent): boolean {
  if (!event.key.startsWith("Arrow")) return false;
  const direction = event.key.slice(5).toLowerCase() as "up" | "down" | "left" | "right";
  if (["up", "down", "left", "right"].includes(direction)) {
    event.preventDefault();
    return navigateSpatial(direction);
  }
  return false;
}