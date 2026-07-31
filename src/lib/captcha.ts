export const RECAPTCHA_SITE_KEY = "6Ld01m0tAAAAAF3mEtOM49srcxPNIsBT3mzXppZ7";
export const RECAPTCHA_SECRET_KEY = "6Ld01m0tAAAAAK2DAB6E4lD7JfQWeTJRpHmOWbvR";

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

export async function renderCaptcha(
  containerId: string,
  onVerify?: (token: string) => void,
  onExpire?: () => void,
): Promise<void> {
  await isReady();
  const container = document.getElementById(containerId);
  if (!container) return;
  // Clear previous widget if any
  container.innerHTML = "";
  try {
    widgetId = (window as any).grecaptcha.render(containerId, {
      sitekey: RECAPTCHA_SITE_KEY,
      theme: "dark",
      callback: (token: string) => {
        if (onVerify) onVerify(token);
      },
      "expired-callback": () => {
        if (onExpire) onExpire();
      },
    });
  } catch {
    widgetId = null;
  }
}

export async function getCaptchaToken(): Promise<string | null> {
  if (widgetId == null || typeof window === "undefined") return null;
  try {
    const token = (window as any).grecaptcha.getResponse(widgetId);
    return token || null;
  } catch {
    return null;
  }
}

export async function resetCaptcha(): Promise<void> {
  if (widgetId == null || typeof window === "undefined") return;
  try {
    (window as any).grecaptcha.reset(widgetId);
  } catch {}
}
