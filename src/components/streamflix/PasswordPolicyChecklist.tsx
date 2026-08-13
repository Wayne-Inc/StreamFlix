import { Check, X } from "lucide-react";
import { policyRules } from "@/lib/password";

export function PasswordPolicyChecklist({ password }: { password: string }) {
  const rules = policyRules(password);
  return (
    <ul className="space-y-1">
      {rules.map((r) => (
        <li
          key={r.label}
          className={`flex items-center gap-2 text-xs ${
            r.met ? "text-emerald-400" : "text-muted-foreground"
          }`}
        >
          {r.met ? <Check className="size-3.5" /> : <X className="size-3.5" />} {r.label}
        </li>
      ))}
    </ul>
  );
}
