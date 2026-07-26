import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-subtle bg-background-elevated p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  hintTone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  hintTone?: "positive" | "negative" | "neutral";
}) {
  const hintColor =
    hintTone === "positive"
      ? "text-emerald-400"
      : hintTone === "negative"
        ? "text-red-400"
        : "text-muted";

  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-3 font-display text-3xl text-gold">{value}</p>
      {hint ? <p className={cn("mt-2 text-xs", hintColor)}>{hint}</p> : null}
    </Card>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border-subtle p-10 text-center text-sm text-muted">
      {message}
    </div>
  );
}
