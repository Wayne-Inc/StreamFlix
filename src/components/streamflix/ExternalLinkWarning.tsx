import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { X, ExternalLink, Check, AlertTriangle } from "lucide-react";
import { createPortal } from "react-dom";

interface ExternalLinkWarningContextType {
  showWarning: (href: string) => Promise<boolean>;
}

const ExternalLinkWarningContext = createContext<ExternalLinkWarningContextType | null>(null);

export function useExternalLinkWarning() {
  const ctx = useContext(ExternalLinkWarningContext);
  if (!ctx) throw new Error("useExternalLinkWarning must be used within ExternalLinkWarningProvider");
  return ctx;
}

// Global registry for external link handling
type WarningHandler = (href: string) => Promise<boolean>;
let globalWarningHandler: WarningHandler | null = null;

export function registerExternalLinkHandler(handler: WarningHandler) {
  globalWarningHandler = handler;
}

export function unregisterExternalLinkHandler() {
  globalWarningHandler = null;
}

export async function triggerExternalLinkWarning(href: string): Promise<boolean> {
  if (globalWarningHandler) {
    return globalWarningHandler(href);
  }
  // Fallback: allow if no handler registered
  return true;
}

function WarningModal({ isOpen, href, onConfirm, onCancel }: {
  isOpen: boolean;
  href: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !isOpen) return null;

  const hostname = new URL(href).hostname;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-md rounded-lg border border-white/10 bg-card/95 shadow-[0_18px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl p-6 text-center">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-lg bg-destructive/15 text-destructive">
          <AlertTriangle className="size-7" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Leaving StreamFlix</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You&apos;re about to visit <span className="font-mono text-foreground break-all">{hostname}</span>.
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          This link leads to an external website. We&apos;re not responsible for its content or privacy practices.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-md border border-border bg-background/60 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
          >
            <X className="size-4 mr-2 inline" /> Stay
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Continue <ExternalLink className="size-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function ExternalLinkWarningProvider({ children }: { children: ReactNode }) {
  const [warningState, setWarningState] = useState<{
    isOpen: boolean;
    href: string;
    resolve: (value: boolean) => void;
  } | null>(null);

  const showWarning = (href: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setWarningState({ isOpen: true, href, resolve });
    });
  };

  useEffect(() => {
    registerExternalLinkHandler(showWarning);
    return () => unregisterExternalLinkHandler();
  }, []);

  const handleConfirm = () => {
    warningState?.resolve(true);
    setWarningState(null);
  };

  const handleCancel = () => {
    warningState?.resolve(false);
    setWarningState(null);
  };

  return (
    <ExternalLinkWarningContext.Provider value={{ showWarning }}>
      {children}
      {warningState && (
        <WarningModal
          isOpen={warningState.isOpen}
          href={warningState.href}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ExternalLinkWarningContext.Provider>
  );
}