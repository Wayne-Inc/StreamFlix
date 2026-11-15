import { useEffect, useState } from "react";

export type RotatingTextOptions = {
  /** How long the first message stays before cycling starts (milliseconds). */
  initialDelay?: number;
  /** How long each later message stays on screen (milliseconds). */
  interval?: number;
};

/**
 * Cycles through `messages` while `active` is true.
 *
 * The first message is shown immediately and stays put for `initialDelay`, so
 * quick operations never flash through several labels. After that the text
 * advances every `interval` and wraps around.
 *
 * Defaults are deliberately unhurried: 2.5s on the first message, then one
 * change every 5s, so the copy reads as a status update rather than a flicker.
 *
 * Pass a stable array (module-level constant), not an inline literal: the timer
 * restarts whenever the array identity changes.
 */
export function useRotatingText(
  active: boolean,
  messages: readonly string[],
  { initialDelay = 2500, interval = 5000 }: RotatingTextOptions = {},
): string {
  const [index, setIndex] = useState(0);
  const total = messages.length;

  useEffect(() => {
    setIndex(0);
    if (!active || messages.length <= 1) return;

    let intervalId: ReturnType<typeof setInterval> | undefined;
    const timeoutId = setTimeout(() => {
      setIndex(1);
      intervalId = setInterval(() => {
        setIndex((current) => (current + 1) % messages.length);
      }, interval);
    }, initialDelay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId !== undefined) clearInterval(intervalId);
    };
  }, [active, initialDelay, interval, messages]);

  return messages[Math.min(index, total - 1)] ?? "";
}
