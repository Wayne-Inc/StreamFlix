import { createContext, useContext, useEffect, useState } from "react";

type MobileNavbarContext = {
  isVisible: boolean;
  setIsVisible: (v: boolean) => void;
};

const MobileNavbarContext = createContext<MobileNavbarContext | null>(null);

export function MobileNavbarProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <MobileNavbarContext.Provider value={{ isVisible, setIsVisible }}>
      {children}
    </MobileNavbarContext.Provider>
  );
}

export function useMobileNavbar() {
  const ctx = useContext(MobileNavbarContext);
  if (!ctx) throw new Error("useMobileNavbar must be used within MobileNavbarProvider");
  return ctx;
}
