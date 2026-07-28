import type { Metadata } from "next";
import { Container } from "@/components/site/Container";
import { ButtonLink } from "@/components/site/Button";
import { MenuTabs } from "@/components/site/MenuTabs";
import { LuxuryHero } from "@/components/site/LuxuryHero";
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
      <LuxuryHero
        image="/hero/hero-gallery-1.jpg"
        alt="Ambiance du restaurant Hope Of Life"
        eyebrow="Restaurant & Bar"
        title="La carte Hope Of Life"
        description="Une cuisine raffinée et une sélection de bar exigeante, entre signatures de la maison, grands flacons et inspirations internationales."
      />

      <Container className="py-16 sm:py-20">
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
