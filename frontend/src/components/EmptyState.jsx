import { Inbox } from "lucide-react";

export default function EmptyState({ message = "Nothing here yet.", hint }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-[var(--color-text-muted)]">
      <Inbox size={28} className="opacity-50" />
      <p className="text-sm">{message}</p>
      {hint && <p className="text-xs opacity-70">{hint}</p>}
    </div>
  );
}
