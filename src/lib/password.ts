export function strengthScore(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

export const STRENGTH_LABELS = ["Too weak", "Weak", "Okay", "Strong", "Excellent"];

export const STRENGTH_COLORS = [
  "bg-destructive",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-emerald-400",
];
