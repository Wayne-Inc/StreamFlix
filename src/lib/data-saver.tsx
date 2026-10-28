import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// Extend Navigator interface for Network Information API
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

type DataSaverCtx = {
  saveData: boolean;
  effectiveSaveData: boolean;
  setSaveData: (v: boolean) => void;
};

const Ctx = createContext<DataSaverCtx>({
  saveData: false,
  effectiveSaveData: false,
  setSaveData: () => {},
});

function getSaveDataPreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    // Check user preference first
    const stored = localStorage.getItem("sf:saveData");
    if (stored === "1") return true;
    if (stored === "0") return false;
    // Check browser's save-data hint
    if (navigator.connection && "saveData" in navigator.connection) {
      return (navigator.connection as any).saveData === true;
    }
    return false;
  } catch {
    return false;
  }
}

function getEffectiveSaveData(userPref: boolean): boolean {
  if (typeof window === "undefined") return userPref;
  // Effective save data is user preference OR browser hint
  try {
    if (navigator.connection && "saveData" in navigator.connection) {
      return userPref || (navigator.connection as any).saveData === true;
    }
  } catch {}
  return userPref;
}

export function DataSaverProvider({ children }: { children: ReactNode }) {
  const [saveData, setSaveDataState] = useState<boolean>(() => getSaveDataPreference());
  const [effectiveSaveData, setEffectiveSaveData] = useState<boolean>(() => getEffectiveSaveData(saveData));

  const setSaveData = (v: boolean) => {
    setSaveDataState(v);
    setEffectiveSaveData(getEffectiveSaveData(v));
    try {
      localStorage.setItem("sf:saveData", v ? "1" : "0");
    } catch {}
  };

  // Listen for changes in browser's save-data hint
  useEffect(() => {
    if (typeof window === "undefined") return;
    const connection = navigator.connection;
    if (!connection) return;

    const handleChange = () => {
      setEffectiveSaveData(getEffectiveSaveData(saveData));
    };

    // @ts-expect-change - connection may not have saveData in types
    connection.addEventListener?.("change", handleChange);
    return () => connection.removeEventListener?.("change", handleChange);
  }, [saveData]);

  // Apply data-saver class to document for CSS targeting
  useEffect(() => {
    const root = document.documentElement;
    if (effectiveSaveData) {
      root.classList.add("data-saver");
    } else {
      root.classList.remove("data-saver");
    }
  }, [effectiveSaveData]);

  return (
    <Ctx.Provider value={{ saveData, effectiveSaveData, setSaveData }}>
      {children}
    </Ctx.Provider>
  );
}

export function useDataSaver() {
  return useContext(Ctx);
}

// Utility to check if we should prefetch/preload
export function shouldPrefetch(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const userPref = localStorage.getItem("sf:saveData");
    if (userPref === "1") return false;
    if (userPref === "0") return true;
    // Check browser hint
    if (navigator.connection && "saveData" in navigator.connection) {
      return (navigator.connection as any).saveData !== true;
    }
    return true;
  } catch {
    return true;
  }
}

// Utility to check if we should load high-quality images
export function shouldLoadHighQuality(): boolean {
  return !shouldPrefetch(); // Inverse - if we shouldn't prefetch, we also shouldn't load high quality
}

// Utility to get appropriate image quality/size
export function getImageQuality(): "low" | "medium" | "high" {
  if (shouldLoadHighQuality()) return "high";
  try {
    // Check connection type for more granular control
    if (navigator.connection) {
      const conn = navigator.connection as any;
      if (conn.effectiveType === "slow-2g" || conn.effectiveType === "2g") return "low";
      if (conn.effectiveType === "3g") return "medium";
    }
  } catch {}
  return "medium";
}