import { strengthScore, STRENGTH_LABELS, STRENGTH_COLORS } from "@/lib/password";

export function PasswordStrengthMeter({ password }: { password: string }) {
  const score = strengthScore(password);
  const hasInput = password.length > 0;

  return (
    <div className="space-y-1.5" aria-live="polite">
      <div
        className="flex items-center gap-1"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={score}
        aria-label="Password strength"
      >
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              hasInput && score >= step ? STRENGTH_COLORS[score] : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p
        className={`text-xs font-medium ${
          hasInput
            ? score === 0
              ? "text-destructive"
              : score <= 2
                ? "text-amber-400"
                : "text-emerald-400"
            : "text-muted-foreground"
        }`}
      >
        {hasInput ? STRENGTH_LABELS[score] : "Enter a password"}
      </p>
    </div>
  );
}
