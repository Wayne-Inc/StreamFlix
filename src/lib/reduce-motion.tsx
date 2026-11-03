import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type ReduceMotionCtx = {
  reduceMotion: boolean;
  setReduceMotion: (v: boolean) => void;
};

const Ctx = createContext<ReduceMotionCtx>({ reduceMotion: false, setReduceMotion: () => {} });

export function ReduceMotionProvider({ children }: { children: ReactNode }) {
  const [reduceMotion, setReduceMotionState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      if (localStorage.getItem("sf:reduceMotion") === "1") return true;
      if (localStorage.getItem("sf:reduceMotion") === "0") return false;
      return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    } catch {
      return false;
    }
  });

  const setReduceMotion = (v: boolean) => {
    setReduceMotionState(v);
    try {
      localStorage.setItem("sf:reduceMotion", v ? "1" : "0");
    } catch {}
  };

  useEffect(() => {
    const root = document.documentElement;
    if (reduceMotion) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }
  }, [reduceMotion]);

  return <Ctx.Provider value={{ reduceMotion, setReduceMotion }}>{children}</Ctx.Provider>;
}

export function useReduceMotion() {
  return useContext(Ctx);
}
