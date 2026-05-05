"use client";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(38,11,50,0.6)" }}
        onClick={onCancel}
      />
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl p-6 shadow-2xl"
        style={{ background: "white" }}
      >
        <h3
          className="font-medium text-lg mb-2 leading-snug"
          style={{ color: "#260B32" }}
        >
          {title}
        </h3>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: "#A159A1" }}>
          {description}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{ background: "#F2E3F2", color: "#5E2460" }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: "#822E7B" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
