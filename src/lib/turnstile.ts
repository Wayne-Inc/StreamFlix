export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

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
  if (typeof window === "undefined") return null;

  await loadTurnstileScript();
  const turnstile = window.turnstile;
  if (!turnstile) return null;

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
        resolve(value);
      };

      widgetId = turnstile.render(div, {
        sitekey: TURNSTILE_SITE_KEY,
        action,
        execution: "execute",
        callback: (t: string) => finish(t || null),
        "error-callback": () => finish(null),
        "timeout-callback": () => finish(null),
        "expired-callback": () => finish(null),
      });

      turnstile.execute(widgetId);
    });

    return token;
  } catch {
    return null;
  } finally {
    if (widgetId) turnstile.remove(widgetId);
    div.remove();
  }
}
