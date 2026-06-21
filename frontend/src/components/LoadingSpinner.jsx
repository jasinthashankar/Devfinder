import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-[var(--color-text-muted)]">
      <Loader2 size={24} className="animate-spin text-[var(--color-accent)]" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
