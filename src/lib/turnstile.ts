export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

let readyPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (readyPromise) return readyPromise;
  readyPromise = new Promise((resolve) => {
    if (typeof window === "undefined") return resolve();
    if ((window as any).turnstile) return resolve();
    const script = document.createElement("script");
    script.src = `https://challenges.cloudflare.com/turnstile/v0/api.js`;
    script.setAttribute("data-cfasync", "false");
    script.async = true;
    script.onload = () => {
      const check = () => {
        if ((window as any).turnstile) resolve();
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
  try {
    // Create a container for the invisible widget
    const div = document.createElement("div");
    div.style.display = "none";
    document.body.appendChild(div);

    const widgetId = (window as any).turnstile.render(div, {
      sitekey: TURNSTILE_SITE_KEY,
      action,
    });

    const token = await (window as any).turnstile.execute(widgetId);
    // Clean up
    (window as any).turnstile.remove(widgetId);
    div.remove();

    return token || null;
  } catch (err) {
    console.error("Turnstile error:", err);
    return null;
  }
}