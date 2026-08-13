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

export const PASSWORD_RULES: { label: string; test: (pw: string) => boolean }[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "Uppercase letter (A-Z)", test: (pw) => /[A-Z]/.test(pw) },
  { label: "Lowercase letter (a-z)", test: (pw) => /[a-z]/.test(pw) },
  { label: "Number (0-9)", test: (pw) => /[0-9]/.test(pw) },
  { label: "Special character (!@#$…)", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export function passwordMeetsPolicy(pw: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(pw));
}

export function policyRules(pw: string): { label: string; met: boolean }[] {
  return PASSWORD_RULES.map((r) => ({ label: r.label, met: r.test(pw) }));
}
