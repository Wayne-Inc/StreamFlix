export const RECAPTCHA_SITE_KEY = "6Ld01m0tAAAAAF3mEtOM49srcxPNIsBT3mzXppZ7";

let readyPromise: Promise<void> | null = null;

function loadEnterpriseScript(): Promise<void> {
  if (readyPromise) return readyPromise;
  readyPromise = new Promise((resolve) => {
    if (typeof window === "undefined") return resolve();
    if ((window as any).grecaptcha?.enterprise) return resolve();
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const check = () => {
        if ((window as any).grecaptcha?.enterprise) resolve();
        else setTimeout(check, 50);
      };
      check();
    };
    document.head.appendChild(script);
  });
  return readyPromise;
}

export async function executeCaptcha(action: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  await loadEnterpriseScript();
  try {
    const token = await (window as any).grecaptcha.enterprise.execute(RECAPTCHA_SITE_KEY, { action });
    return token || null;
  } catch {
    return null;
  }
}
