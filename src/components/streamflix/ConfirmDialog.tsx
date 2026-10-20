import { X } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4">
      <div className="relative w-full max-w-sm rounded-md bg-card p-6 shadow-2xl text-center">
        <button
          onClick={onCancel}
          disabled={busy}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground disabled:opacity-50"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
        <h2 className="text-xl font-semibold">{title}</h2>
        {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`w-full rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
              destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={busy}
            className="w-full rounded-md border border-border px-4 py-2 text-sm transition hover:bg-accent disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
