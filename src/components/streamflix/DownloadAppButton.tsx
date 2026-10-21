import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { isInApp } from "@/lib/app-downloads";
import { canPromptInstall, hasInstalledPWA, promptInstall } from "@/lib/pwa";

const FALLBACK_URL = "https://github.com/Wayne-Inc/StreamFlix/releases";

interface DownloadAppButtonProps {
  className?: string;
  iconClassName?: string;
}

export function DownloadAppButton({ className, iconClassName = "size-5" }: DownloadAppButtonProps) {
  const [checked, setChecked] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const check = () => {
      setCanInstall(canPromptInstall());
      setInstalled(hasInstalledPWA());
      setChecked(true);
    };
    check();
    window.addEventListener("beforeinstallprompt", check as EventListener);
    window.addEventListener("appinstalled", check as EventListener);
    return () => {
      window.removeEventListener("beforeinstallprompt", check as EventListener);
      window.removeEventListener("appinstalled", check as EventListener);
    };
  }, []);

  if (!checked || isInApp() || installed) return null;

  const handleInstall = async () => {
    if (installing) return;
    setInstalling(true);
    const result = await promptInstall();
    setInstalling(false);
    setCanInstall(canPromptInstall());
    if (result === "unavailable") {
      window.open(FALLBACK_URL, "_blank", "noopener,noreferrer");
    }
  };

  if (!canInstall) {
    return (
      <a href={FALLBACK_URL} target="_blank" rel="noopener noreferrer" className={className}>
        <Download className={iconClassName} />
        Download the App
      </a>
    );
  }

  return (
    <button type="button" onClick={handleInstall} disabled={installing} className={className}>
      <Download className={iconClassName} />
      {installing ? "Opening..." : "Download the App"}
    </button>
  );
}
