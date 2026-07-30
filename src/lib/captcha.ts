const SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

let widgetId: number | null = null;
let readyPromise: Promise<void> | null = null;

function isReady(): Promise<void> {
  if (readyPromise) return readyPromise;
  readyPromise = new Promise((resolve) => {
    if (typeof window === "undefined") return resolve();
    if ((window as any).grecaptcha?.render) return resolve();
    (window as any).onRecaptchaReady = () => resolve();
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?onload=onRecaptchaReady&render=explicit`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
  return readyPromise;
}

export async function renderCaptcha(containerId: string): Promise<void> {
  await isReady();
  if (widgetId != null) return;
  widgetId = (window as any).grecaptcha.render(containerId, {
    sitekey: SITE_KEY,
    theme: "dark",
  });
}

export async function getCaptchaToken(): Promise<string | null> {
  if (widgetId == null || typeof window === "undefined") return null;
  const token = (window as any).grecaptcha.getResponse(widgetId);
  return token || null;
}

export async function resetCaptcha(): Promise<void> {
  if (widgetId == null || typeof window === "undefined") return;
  (window as any).grecaptcha.reset(widgetId);
}
