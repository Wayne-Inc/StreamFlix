import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { isInApp } from "@/lib/app-downloads";
import { canPromptInstall, isPWAInstalled, promptInstall } from "@/lib/pwa";

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
      setInstalled(isPWAInstalled());
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

  if (!checked || isInApp() || installed || !canInstall) return null;

  const handleInstall = async () => {
    if (installing) return;
    setInstalling(true);
    await promptInstall();
    setInstalling(false);
    setCanInstall(canPromptInstall());
    setInstalled(isPWAInstalled());
  };

  return (
    <button type="button" onClick={handleInstall} disabled={installing} className={className}>
      <Download className={iconClassName} />
      {installing ? "Installing..." : "Install App"}
    </button>
  );
}
