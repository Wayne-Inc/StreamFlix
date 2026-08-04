import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Copy, Link2, RotateCw } from "lucide-react";
import { toast } from "sonner";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

function getSelectedText() {
  const el = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
  const start = el?.selectionStart;
  const end = el?.selectionEnd;
  if (
    el &&
    (el.tagName === "INPUT" || el.tagName === "TEXTAREA") &&
    typeof start === "number" &&
    typeof end === "number" &&
    start !== end
  ) {
    return el.value.slice(start, end).trim();
  }
  return window.getSelection()?.toString().trim() ?? "";
}

export function GlobalContextMenu({ children }: { children: ReactNode }) {
  const router = useRouter();
  const maxIndex = useRef(
    typeof window !== "undefined" ? (window.history.state?.__TSR_index ?? 0) : 0,
  );
  const [nav, setNav] = useState({ canBack: false, canForward: false });
  const [hasSelection, setHasSelection] = useState(false);

  useEffect(() => {
    const update = () => {
      const idx = typeof window !== "undefined" ? (window.history.state?.__TSR_index ?? 0) : 0;
      if (idx > maxIndex.current) maxIndex.current = idx;
      setNav({
        canBack: router.history.canGoBack(),
        canForward: idx < maxIndex.current,
      });
    };
    update();
    const unsub = router.subscribe("onResolved", update);
    window.addEventListener("popstate", update);
    return () => {
      unsub();
      window.removeEventListener("popstate", update);
    };
  }, [router]);

  const copyToClipboard = async (text: string, successMsg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMsg);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <ContextMenu
      modal={false}
      onOpenChange={(open) => setHasSelection(open && !!getSelectedText())}
    >
      <ContextMenuTrigger asChild>
        <div className="min-h-dvh">{children}</div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={() => window.location.reload()}>
          <RotateCw className="mr-2 h-4 w-4" />
          Reload
          <ContextMenuShortcut>Ctrl+R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem disabled={!nav.canBack} onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
          <ContextMenuShortcut>Alt+←</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem disabled={!nav.canForward} onClick={() => window.history.forward()}>
          <ArrowRight className="mr-2 h-4 w-4" />
          Forward
          <ContextMenuShortcut>Alt+→</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => copyToClipboard(window.location.href, "Link copied")}>
          <Link2 className="mr-2 h-4 w-4" />
          Copy page URL
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!hasSelection}
          onClick={() => {
            const text = getSelectedText();
            if (text) copyToClipboard(text, "Selection copied");
          }}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy selected text
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
