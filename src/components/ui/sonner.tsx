import { useEffect, useState } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.matchMedia("(min-width: 768px)").matches : true,
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isDesktop;
}

const Toaster = ({ ...props }: ToasterProps) => {
  const isDesktop = useIsDesktop();
  return (
    <Sonner
      className="toaster group"
      theme="dark"
      richColors
      position={isDesktop ? "bottom-right" : "top-right"}
      mobileOffset={{ top: 64 }}
      closeButton
      expand
      visibleToasts={4}
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:border-border group-[.toast]:bg-background group-[.toast]:text-muted-foreground group-[.toast:hover]:text-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
