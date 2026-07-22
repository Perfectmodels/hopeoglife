import { cn } from "@/lib/utils";

export function FormField({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className="text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputClasses =
  "w-full rounded-lg border border-border-subtle bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted/60 outline-none transition-colors focus:border-gold";
