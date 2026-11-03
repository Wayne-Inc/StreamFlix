import { type ReactNode } from "react";
import { useExternalLinkWarning } from "./ExternalLinkWarning";
import { openExternal } from "@/lib/open-external";

export function ExternalLink({
  href,
  children,
  className,
  onClick,
  skipWarning = false,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  skipWarning?: boolean;
}) {
  const { showWarning } = useExternalLinkWarning();

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onClick?.();

    if (skipWarning) {
      openExternal(href);
      return;
    }

    const shouldProceed = await showWarning(href);
    if (shouldProceed) {
      openExternal(href);
    }
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
