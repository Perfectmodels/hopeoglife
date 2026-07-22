import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandedVisual({
  label,
  className,
  watermarkSize = 96,
}: {
  label?: string;
  className?: string;
  watermarkSize?: number;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-2xl border border-border-subtle bg-gradient-to-br from-gold/15 via-background to-background",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(233,220,189,0.10), transparent 45%), radial-gradient(circle at 75% 80%, rgba(201,162,74,0.16), transparent 45%)",
        }}
      />
      <Image
        src="/Logo.png"
        alt=""
        aria-hidden
        width={watermarkSize}
        height={Math.round(watermarkSize * 1.125)}
        className="relative opacity-[0.16]"
      />
      {label ? (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/85 to-transparent px-3 pb-3 pt-8">
          <p className="text-center text-[11px] uppercase tracking-[0.2em] text-muted">{label}</p>
        </div>
      ) : null}
    </div>
  );
}
