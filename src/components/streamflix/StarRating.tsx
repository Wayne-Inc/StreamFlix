import { Star } from "lucide-react";

type StarRatingProps = {
  rating: number | null;
  onRate: (rating: number) => void;
  readonly?: boolean;
};

export function StarRating({ rating, onRate, readonly = false }: StarRatingProps) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  const getState = (star: number, hovered: number | null) => {
    const value = hovered ?? rating ?? 0;
    const total = value;
    const starMax = star * 2;
    const starMin = starMax - 1;
    if (total >= starMax) return "full";
    if (total >= starMin) return "half";
    return "empty";
  };

  return (
    <div className="flex items-center gap-0.5">
      {stars.map((star) => {
        const state = getState(star, null);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onRate(star * 2)}
            onMouseEnter={(e) => {
              if (readonly) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const isHalf = x < rect.width / 2;
              const el = e.currentTarget;
              let prev = el.previousElementSibling;
              let current: Element | null = el;
              let idx = star;
              while (current) {
                const s = getState(idx, isHalf && current === el ? idx * 2 - 1 : idx * 2);
                const icon = current.querySelector("svg");
                if (icon) {
                  icon.setAttribute("fill", s === "full" ? "currentColor" : s === "half" ? "currentColor" : "none");
                  icon.style.opacity = s === "empty" ? "0.2" : "1";
                  if (s === "half") icon.style.clipPath = "inset(0 50% 0 0)";
                  else icon.style.clipPath = "";
                }
                idx--;
                current = prev;
                prev = prev?.previousElementSibling ?? null;
              }
            }}
            onMouseLeave={() => {
              if (readonly) return;
              document.querySelectorAll("[data-star-btn]").forEach((el) => {
                const icon = el.querySelector("svg");
                if (icon) {
                  icon.style.clipPath = "";
                  icon.style.opacity = "";
                }
              });
            }}
            data-star-btn
            className={`${readonly ? "cursor-default" : "cursor-pointer"} p-1.5 transition-transform ${!readonly ? "hover:scale-110" : ""}`}
            aria-label={`Rate ${star * 2}`}
          >
            <Star
              className="size-5 sm:size-6 text-yellow-400"
              fill={state === "full" ? "currentColor" : state === "half" ? "currentColor" : "none"}
              style={{
                opacity: state === "empty" ? 0.2 : 1,
                ...(state === "half" ? { clipPath: "inset(0 50% 0 0)" } : {}),
              }}
            />
          </button>
        );
      })}
      {rating != null && (
        <span className="ml-1.5 text-xs font-medium text-muted-foreground">
          {rating}/10
        </span>
      )}
    </div>
  );
}
