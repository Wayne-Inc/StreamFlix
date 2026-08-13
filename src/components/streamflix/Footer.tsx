import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background px-4 sm:px-8 py-12 text-sm text-muted-foreground">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-3">
            {[Facebook, Instagram, Twitter, Youtube].map((I, i) => (
              <a
                key={i}
                href="#"
                className="hover:text-foreground transition-colors p-2"
                aria-label="social"
              >
                <I className="size-5" />
              </a>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <Link to="/tos" className="hover:text-foreground">
              Terms of Service
            </Link>
            <Link to="/privacy-policy" className="hover:text-foreground">
              Privacy Policy
            </Link>
          </div>
        </div>
        <div className="max-w-2xl space-y-2 rounded-lg border border-yellow-500/10 bg-yellow-500/5 px-4 py-3 text-[10px] sm:text-xs leading-relaxed text-yellow-400/80">
          <p>
            This is a project created by{" "}
            <strong className="text-yellow-400/90">Samwel Wayne</strong>.
          </p>
          <p>
            Redistribution, reproduction, or public display of any part of this platform without the
            express written consent of Samwel Wayne is strictly prohibited. This includes, but is
            not limited to, copying, modifying, or re-uploading the software, design, or any content
            accessed through it.
          </p>
        </div>
      </div>
    </footer>
  );
}
