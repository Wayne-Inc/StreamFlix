import { type ReactNode } from "react";
import { openExternal } from "@/lib/open-external";

export function ExternalLink({
  href,
  children,
  className,
  onClick,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
        openExternal(href);
      }}
    >
      {children}
    </a>
  );
}
