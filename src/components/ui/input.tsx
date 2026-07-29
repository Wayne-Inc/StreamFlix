import * as React from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onInvalid, ...props }, ref) => {
    const handleInvalid: React.FormEventHandler<HTMLInputElement> = (e) => {
      e.preventDefault();
      // call any provided handler as well
      try {
        onInvalid && (onInvalid as any)(e);
      } catch {}
      const target = e.target as HTMLInputElement | null;
      const msg = (target && (target.placeholder || target.getAttribute("aria-label"))) || "Please fill this field";
      toast.error(msg);
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        onInvalid={handleInvalid}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
