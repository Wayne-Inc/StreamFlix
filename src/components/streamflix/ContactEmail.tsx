import { type MouseEvent, type ReactNode } from "react";

const EMAIL_LOCAL = "hello";
const EMAIL_DOMAIN = "samway.dpdns.org";
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
      <span>{EMAIL_LOCAL}</span>
      {"@"}
      <span>{EMAIL_DOMAIN}</span>
    </a>
  );
}
