import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

import appCss from "../styles.css?url";
import { registerSW } from "../lib/pwa";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { CookieConsent } from "@/components/streamflix/CookieConsent";

import { GlobalContextMenu } from "@/components/streamflix/GlobalContextMenu";
import { ExternalLinkWarningProvider, triggerExternalLinkWarning } from "@/components/streamflix/ExternalLinkWarning";
import { ScreenSaver } from "@/components/streamflix/ScreenSaver";
import { auth, db } from "@/lib/firebase";
import { metaImageUrl } from "@/lib/seo";
import { useNavTracker } from "@/lib/nav-history";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { ReduceMotionProvider } from "@/lib/reduce-motion";

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

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);

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
              window.location.reload();
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
      { name: "viewport", content: "width=device-width, initial-scale=1, interactive-widget=resizes-content" },
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
      { name: "google-adsense-account", content: "ca-pub-5529326688604668" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
        as: "style",
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
        <script
          data-cfasync="false"
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            ad_storage: 'denied',
            analytics_storage: 'denied',
            wait_for_update: 500
          });
          (function () {
            var c = null;
            try { c = localStorage.getItem('streamflix:cookieConsent') || null; } catch (e) {}
            if (!c) {
              try {
                var m = document.cookie.match(/(?:^|; )streamflix_cookie_consent=([^;]+)/);
                c = m ? m[1] : null;
              } catch (e) {}
            }
            if (c === 'accepted') {
              gtag('consent', 'update', {
                ad_user_data: 'granted',
                ad_personalization: 'granted',
                ad_storage: 'granted',
                analytics_storage: 'granted'
              });
              var s = document.createElement('script');
              s.async = true;
              s.dataset.streamflixGtag = 'true';
              s.src = 'https://www.googletagmanager.com/gtag/js?id=G-V9783E9S0W';
              document.head.appendChild(s);
            }
          })();
          gtag('js', new Date());
          gtag('config', 'G-V9783E9S0W');`,
          }}
        />
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

  useNavTracker();

  // Scroll to top on route changes.
  const pathname = useLocation().pathname;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    registerSW();

    const handleExternalLink = async (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      // Handle mailto: links natively (let OS handle them)
      const isMailto = href.startsWith("mailto:");
      const isExternalHttp = href.startsWith("http");
      const origin = window.location.origin;
      if (isExternalHttp && href.startsWith(origin)) return;
      if (isMailto) return; // Let the browser/app handle mailto natively
      if (!isExternalHttp) return;
      
      // Check if it's an auth-related link (internal routes)
      const isAuthLink = href.includes("/auth") || href.includes("/login") || href.includes("/signup");
      if (isAuthLink) return;
      
      // Prevent all external redirects from watch page
      const isWatchPage = window.location.pathname.startsWith("/watch/");
      if (isWatchPage) {
        e.preventDefault();
        toast.warning("External links are blocked on the watch page");
        return;
      }
      
      e.preventDefault();
      const shouldProceed = await triggerExternalLinkWarning(href);
      if (shouldProceed) {
        window.location.href = href;
      }
    };
    document.addEventListener("click", handleExternalLink, true);

    const unsub = onAuthStateChanged(auth, (user) => {
      try {
        if (user) {
          localStorage.setItem("sf:auth", "1");
        } else {
          localStorage.removeItem("sf:auth");
        }
      } catch {}
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
    import("@/lib/mobile").then(({ initMobileApp }) => {
      initMobileApp().catch(() => {});
    });
    import("@/lib/push").then(({ setupForegroundPush, ensurePushSubscription }) => {
      setupForegroundPush();
      ensurePushSubscription();
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
      // If we are on the watch page, do not redirect to offline page.
      if (/^\/watch\/[^/]+/.test(window.location.pathname)) {
        return;
      }
      if (window.location.pathname !== offlineRoute) {
        sessionStorage.setItem("sf:returnUrl", window.location.pathname + window.location.search);
        window.location.replace(offlineRoute);
      }
    };
    const handleOnline = () => {
      if (window.location.pathname === offlineRoute) {
        const returnUrl = sessionStorage.getItem("sf:returnUrl");
        sessionStorage.removeItem("sf:returnUrl");
        window.location.replace(returnUrl || "/browse");
      }
    };

    if (!navigator.onLine) handleOffline();

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      unsub();
      document.removeEventListener("click", handleExternalLink, true);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <ReduceMotionProvider>
        <ExternalLinkWarningProvider>
          <GlobalContextMenu>
            <div className="wco-titlebar-padding">
              <Toaster />
              <Outlet />
              <CookieConsent />
              <ScreenSaver />
              <Analytics />
              <SpeedInsights />
            </div>
          </GlobalContextMenu>
        </ExternalLinkWarningProvider>
      </ReduceMotionProvider>
    </QueryClientProvider>
  );
}