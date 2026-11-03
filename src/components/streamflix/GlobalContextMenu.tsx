import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Copy, ExternalLink, Link2, RotateCw } from "lucide-react";
import { toast } from "sonner";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export function GlobalContextMenu({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isWatchPage =
    typeof window !== "undefined" && router.state.location.pathname.startsWith("/watch");
  const maxIndex = useRef(
    typeof window !== "undefined" ? (window.history.state?.__TSR_index ?? 0) : 0,
  );
  const [nav, setNav] = useState({ canBack: false, canForward: false });
  const [cardContext, setCardContext] = useState<{ title: string; url: string } | null>(null);
  const [menuKey, setMenuKey] = useState(0);

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

  if (isWatchPage) return <>{children}</>;

  return (
    <ContextMenu modal={false}>
      <ContextMenuTrigger asChild>
        <div
          className="min-h-dvh"
          onContextMenu={(e) => {
            const el = (e.target as HTMLElement).closest<HTMLElement>("[data-context='movie']");
            setCardContext(
              el ? { title: el.dataset.title ?? "", url: el.dataset.url ?? "" } : null,
            );
            setMenuKey((k) => k + 1);
          }}
        >
          {children}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent key={menuKey} className="w-56 border-border/60 bg-background/75 backdrop-blur-xl">
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
        {cardContext && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => copyToClipboard(cardContext.title, "Title copied")}>
              <Copy className="mr-2 h-4 w-4" />
              Copy movie/show title
            </ContextMenuItem>
            <ContextMenuItem onClick={() => window.open(cardContext.url, "_blank", "noopener")}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open page in new tab
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
