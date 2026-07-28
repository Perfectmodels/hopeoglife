import Image from "next/image";
import { Container } from "./Container";
import { cn } from "@/lib/utils";

export function LuxuryHero({
  image,
  alt,
  eyebrow,
  title,
  description,
  align = "center",
  children,
}: {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
  children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate min-h-[23rem] overflow-hidden border-b border-gold/20 sm:min-h-[28rem]">
      <Image src={image} alt={alt} fill priority className="object-cover" sizes="100vw" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,3,4,.97)_0%,rgba(3,3,4,.76)_48%,rgba(3,3,4,.28)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_32%,rgba(214,171,81,.18),transparent_32rem)]" />
      <div className="luxury-grid absolute inset-0 opacity-25" />

      <Container
        className={cn(
          "relative flex min-h-[23rem] items-center py-14 sm:min-h-[28rem] sm:py-20",
          align === "center" && "justify-center text-center"
        )}
      >
        <div className={cn("max-w-3xl", align === "center" && "flex flex-col items-center")}>
          <p className="luxury-kicker">{eyebrow}</p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[0.95] tracking-[-0.035em] text-champagne sm:text-6xl lg:text-7xl">
            {title}
          </h1>
          <div className={cn("mt-5 h-px w-20 bg-gradient-to-r from-gold to-transparent", align === "center" && "bg-gradient-to-r from-transparent via-gold to-transparent")} />
          <p className="mt-5 max-w-2xl text-sm leading-7 text-champagne/70 sm:text-base">
            {description}
          </p>
          {children ? <div className="mt-8 flex flex-wrap gap-3">{children}</div> : null}
        </div>
      </Container>
    </section>
  );
}
