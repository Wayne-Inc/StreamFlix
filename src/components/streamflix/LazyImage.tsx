import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";

type LazyImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & { src: string };

export function LazyImage({ src, alt = "", ...rest }: LazyImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setLoaded(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setLoaded(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <img
      ref={ref}
      src={loaded ? src : undefined}
      alt={alt}
      loading="lazy"
      decoding="async"
      {...rest}
    />
  );
}
