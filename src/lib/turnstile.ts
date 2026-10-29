export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

console.log("[Debug] Turnstile init - VITE_TURNSTILE_SITE_KEY:", TURNSTILE_SITE_KEY ? "SET" : "MISSING");
console.log("[Debug] Turnstile - User Agent:", typeof navigator !== "undefined" ? navigator.userAgent : "SSR");

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement | string, options: Record<string, unknown>) => string;
      execute: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

let readyPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (readyPromise) return readyPromise;
  readyPromise = new Promise((resolve) => {
    if (typeof window === "undefined") return resolve();
    if (window.turnstile) return resolve();
    const script = document.createElement("script");
    script.src = `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit`;
    script.setAttribute("data-cfasync", "false");
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const check = () => {
        if (window.turnstile) resolve();
        else setTimeout(check, 50);
      };
      check();
    };
    document.head.appendChild(script);
  });
  return readyPromise;
}

export async function executeTurnstile(action: string): Promise<string | null> {
  if (typeof window === "undefined") {
    console.log("[Debug] Turnstile: SSR, skipping");
    return null;
  }

  console.log("[Debug] Turnstile: Loading script...");
  await loadTurnstileScript();
  const turnstile = window.turnstile;
  if (!turnstile) {
    console.error("[Debug] Turnstile: window.turnstile NOT available after load");
    return null;
  }
  console.log("[Debug] Turnstile: Script loaded, rendering widget...");

  const div = document.createElement("div");
  div.style.display = "none";
  document.body.appendChild(div);

  let widgetId: string | null = null;

  try {
    const token = await new Promise<string | null>((resolve) => {
      let settled = false;
      const finish = (value: string | null) => {
        if (settled) return;
        settled = true;
        console.log("[Debug] Turnstile: Callback fired, value:", value ? "TOKEN" : "NULL");
        resolve(value);
      };

      widgetId = turnstile.render(div, {
        sitekey: TURNSTILE_SITE_KEY,
        action,
        execution: "execute",
        callback: (t: string) => finish(t || null),
        "error-callback": () => {
          console.error("[Debug] Turnstile: error-callback fired");
          finish(null);
        },
        "timeout-callback": () => {
          console.error("[Debug] Turnstile: timeout-callback fired");
          finish(null);
        },
        "expired-callback": () => {
          console.error("[Debug] Turnstile: expired-callback fired");
          finish(null);
        },
      });
      console.log("[Debug] Turnstile: Widget rendered, ID:", widgetId);

      turnstile.execute(widgetId);
      console.log("[Debug] Turnstile: execute() called");
    });

    console.log("[Debug] Turnstile: Final token:", token ? "OK" : "NULL");
    return token;
  } catch (err) {
    console.error("[Debug] Turnstile: Exception:", err);
    return null;
  } finally {
    if (widgetId) turnstile.remove(widgetId);
    div.remove();
  }
}
