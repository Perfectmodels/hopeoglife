import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/site/Container";
import { ButtonLink } from "@/components/site/Button";
import { MenuTabs } from "@/components/site/MenuTabs";
import { getMenuByKind } from "@/lib/queries/menu";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Découvrez le menu du restaurant et la carte du bar Hope Of Life : entrées, plats, grillades, desserts, cocktails signature, champagnes et spiritueux.",
};

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const [restaurant, bar] = await Promise.all([
    getMenuByKind("restaurant"),
    getMenuByKind("bar"),
  ]);

  return (
    <section>
      {/* Hero bannière */}
      <div className="relative overflow-hidden bg-background">
        <Image
          src="/hero/hero-gallery-1.jpg"
          alt="Ambiance du restaurant Hope Of Life"
          width={1920}
          height={600}
          className="h-56 w-full object-cover sm:h-72 lg:h-96"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Container className="text-center">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-gold">
              Restaurant & Bar
            </p>
            <h1 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">
              Notre carte
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted">
              Une cuisine raffinée et des cocktails signature, entre saveurs locales et inspirations
              internationales.
            </p>
            <div className="divider-gold mx-auto mt-6 h-px w-16" />
          </Container>
        </div>
      </div>

      <Container className="py-24">
        <MenuTabs restaurant={restaurant} bar={bar} initialTab={tab === "bar" ? "bar" : "restaurant"} />

        <div className="mt-16 flex flex-wrap gap-4 border-t border-border-subtle/70 pt-10">
          <ButtonLink href="/reservation">Réserver une table</ButtonLink>
          <ButtonLink href="/commande" variant="outline">
            Commander en ligne
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
