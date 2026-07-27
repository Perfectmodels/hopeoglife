import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "dashboard-card rounded-[0.9rem] border border-border-subtle bg-background-elevated p-5 sm:p-6",
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
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  hintTone?: "positive" | "negative" | "neutral";
  icon?: React.ElementType;
}) {
  const hintColor =
    hintTone === "positive"
      ? "text-emerald-400"
      : hintTone === "negative"
        ? "text-red-400"
        : "text-muted";

  return (
    <Card className="relative overflow-hidden p-5">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">
            {label}
          </p>
          <p className="mt-2 text-[1.7rem] font-semibold leading-none tracking-[-0.04em] text-foreground sm:text-[2rem]">
            {value}
          </p>
          {hint ? <p className={cn("mt-2 text-xs font-medium", hintColor)}>{hint}</p> : null}
        </div>
        {Icon ? (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.06] text-gold">
            <Icon size={19} strokeWidth={1.7} />
          </span>
        ) : null}
      </div>
    </Card>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border-subtle p-8 text-center text-sm text-muted">
      {message}
    </div>
  );
}
