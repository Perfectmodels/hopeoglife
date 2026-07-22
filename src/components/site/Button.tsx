import Link from "next/link";
import { cn } from "@/lib/utils";

type CommonProps = {
  variant?: "primary" | "outline" | "ghost";
  className?: string;
  children: React.ReactNode;
};

const variantClasses: Record<NonNullable<CommonProps["variant"]>, string> = {
  primary:
    "bg-gold text-background hover:bg-gold-soft shadow-[0_0_0_1px_rgba(201,162,74,0.4)]",
  outline:
    "border border-gold/50 text-champagne hover:border-gold hover:bg-gold/10",
  ghost: "text-champagne hover:text-gold",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium tracking-wide transition-colors duration-200";

export function ButtonLink({
  href,
  variant = "primary",
  className,
  children,
  ...rest
}: CommonProps & { href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <Link href={href} className={cn(base, variantClasses[variant], className)} {...rest}>
      {children}
    </Link>
  );
}

export function Button({
  variant = "primary",
  className,
  children,
  ...rest
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(base, variantClasses[variant], className)} {...rest}>
      {children}
    </button>
  );
}
