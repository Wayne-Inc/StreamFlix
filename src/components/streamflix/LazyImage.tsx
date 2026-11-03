import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";

type LazyImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & { 
  src: string;
  placeholder?: string;
  width?: number;
  height?: number;
};

function getLqipUrl(src: string, width = 20): string {
  try {
    const url = new URL(src);
    const host = url.hostname.toLowerCase();
    const allowedHosts = new Set(["image.tmdb.org"]);
    if (allowedHosts.has(host)) {
      const path = url.pathname;
      return `https://image.tmdb.org/t/p/w${width}${path}`;
    }
  } catch {}
  return src;
}

export function LazyImage({ src, placeholder, width, height, alt = "", className = "", style, ...rest }: LazyImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const [error, setError] = useState(false);

  // LQIP placeholder
  const lqipSrc = placeholder || (src ? getLqipUrl(src, 20) : undefined);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const handleLoad = () => setLoaded(true);
  const handleError = () => setError(true);

  const aspectRatio = width && height ? `${width / height}` : undefined;

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ 
        ...style, 
        aspectRatio: aspectRatio || style?.aspectRatio 
      } as React.CSSProperties}
    >
      {lqipSrc && !loaded && !error && (
        <img
          src={lqipSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl transition-all duration-700 ease-out opacity-60"
          style={{ filter: "blur(20px)" }}
        />
      )}
      <img
        ref={ref}
        src={inView && !error ? src : undefined}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-700 ease-out",
          loaded ? "opacity-100" : "opacity-0",
          error ? "opacity-0" : ""
        )}
        {...rest}
      />
      {(loaded || error) && lqipSrc && (
        <img
          src={lqipSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
        />
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface/60 text-xs text-muted-foreground">
          Failed to load
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
