const GA_ID = "G-V9783E9S0W";

let loaded = false;

export function initAnalytics() {
  if (typeof window === "undefined" || loaded) return;
  loaded = true;

  const w = window as Window & {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  };

  w.dataLayer = w.dataLayer || [];
  w.gtag = (...args: unknown[]) => {
    w.dataLayer!.push(args);
  };
  w.gtag("js", new Date());
  w.gtag("config", GA_ID);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
}
