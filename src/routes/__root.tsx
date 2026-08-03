import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { registerSW } from "../lib/pwa";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/streamflix/CookieConsent";
import { CustomTitleBar } from "@/components/streamflix/CustomTitleBar";
import { ScreenSaver } from "@/components/streamflix/ScreenSaver";
import { auth, db } from "@/lib/firebase";
import { metaImageUrl } from "@/lib/seo";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "StreamFlix" },
      { name: "description", content: "Unlimited movies, TV shows, and more" },
      { name: "theme-color", content: "#E50914" },
      { name: "mobile-web-app-capable", content: "yes" },
      { property: "og:title", content: "StreamFlix" },
      { property: "og:description", content: "Unlimited movies, TV shows, and more" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "StreamFlix" },
      { property: "og:image", content: metaImageUrl() },
      { property: "og:image:width", content: "1101" },
      { property: "og:image:height", content: "1101" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "StreamFlix" },
      { name: "twitter:description", content: "Unlimited movies, TV shows, and more" },
      { name: "twitter:image", content: metaImageUrl() },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "preconnect", href: "https://firestore.googleapis.com" },
      { rel: "preconnect", href: "https://identitytoolkit.googleapis.com" },
      { rel: "preconnect", href: "https://securetoken.googleapis.com" },
      { rel: "preconnect", href: "https://image.tmdb.org" },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const initial = useRef(true);
  const photoSaved = useRef<string | null>(null);
  const offlineRoute = "/offline";

  // Scroll to top on route changes.
  const pathname = useLocation().pathname;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.electronAPI) {
      document.body.classList.add("electron-app");
    }
    registerSW();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (initial.current) {
        initial.current = false;
        return;
      }
      router.invalidate();
      if (user) queryClient.invalidateQueries();
    });
    import("@/lib/device-tracking").then(({ recordCurrentDevice }) => {
      recordCurrentDevice().catch(() => {});
    });
    const u = auth.currentUser;
    if (u?.photoURL && u.photoURL !== photoSaved.current) {
      photoSaved.current = u.photoURL;
      setDoc(
        doc(db, "profiles", u.uid),
        {
          avatar_url: u.photoURL,
          updated_at: serverTimestamp(),
        },
        { merge: true },
      ).catch(() => {});
    }

    const handleOffline = () => {
      if (window.location.pathname !== offlineRoute) {
        sessionStorage.setItem("sf:returnUrl", window.location.pathname + window.location.search);
        router.navigate({ to: offlineRoute, replace: true });
      }
    };
    const handleOnline = () => {
      if (window.location.pathname === offlineRoute) {
        const returnUrl = sessionStorage.getItem("sf:returnUrl");
        sessionStorage.removeItem("sf:returnUrl");
        window.location.href = returnUrl || "/browse";
      }
    };

    if (!navigator.onLine) handleOffline();

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      unsub();
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <CustomTitleBar />
      <div>
        <Toaster richColors theme="dark" position="top-center" />
        <Outlet />
        <CookieConsent />
        <ScreenSaver />
      </div>
    </QueryClientProvider>
  );
}
