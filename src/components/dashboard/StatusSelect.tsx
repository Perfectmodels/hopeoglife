"use client";

import { useTransition } from "react";
import { cn } from "@/lib/utils";

export function StatusSelect({
  value,
  options,
  onChange,
  className,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (newValue: string) => Promise<unknown>;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={value}
      disabled={isPending}
      onChange={(e) => {
        const newValue = e.target.value;
        startTransition(() => {
          onChange(newValue);
        });
      }}
      className={cn(
        "rounded-lg border border-border-subtle bg-background px-3 py-1.5 text-xs text-foreground outline-none transition-all duration-150 focus:border-gold disabled:opacity-50",
        className
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
