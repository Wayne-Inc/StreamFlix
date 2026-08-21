import { type MouseEvent, type ReactNode } from "react";

const EMAIL_LOCAL = "hello";
const EMAIL_DOMAIN = "itiswayneee.dpdns.org";
const EMAIL = `${EMAIL_LOCAL}@${EMAIL_DOMAIN}`;

export function ContactEmail({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.location.href = `mailto:${EMAIL}`;
  };

  return (
    <a href="#" onClick={handleClick} className={className}>
      {children}
      <span className="inline">
        <span>{EMAIL_LOCAL}</span>
        {"@"}
        <span>{EMAIL_DOMAIN}</span>
      </span>
    </a>
  );
}
