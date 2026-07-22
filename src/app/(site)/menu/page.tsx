import type { Metadata } from "next";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/site/Button";
import { BrandedVisual } from "@/components/site/BrandedVisual";
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
    <section className="py-24">
      <Container>
        <SectionHeading
          eyebrow="Restaurant & Bar"
          title="Notre carte"
          description="Une cuisine raffinée et des cocktails signature, entre saveurs locales et inspirations internationales."
        />

        <BrandedVisual className="mt-10 h-48 sm:h-64" watermarkSize={110} />

        <div className="mt-10">
          <MenuTabs restaurant={restaurant} bar={bar} initialTab={tab === "bar" ? "bar" : "restaurant"} />
        </div>

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
