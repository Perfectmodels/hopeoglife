import type { Metadata } from "next";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/site/Button";
import { MenuList } from "@/components/site/MenuList";
import { BrandedVisual } from "@/components/site/BrandedVisual";
import { getMenuByKind } from "@/lib/queries/menu";

export const metadata: Metadata = {
  title: "Menu du restaurant",
  description:
    "Découvrez le menu du restaurant Hope Of Life : entrées, plats, grillades, spécialités et desserts.",
};

export default async function MenuPage() {
  const categories = await getMenuByKind("restaurant");

  return (
    <section className="py-24">
      <Container>
        <SectionHeading
          eyebrow="Restaurant"
          title="Notre menu"
          description="Une cuisine raffinée, entre saveurs locales et inspirations internationales. Composée chaque jour avec des produits sélectionnés."
        />

        <BrandedVisual className="mt-10 h-48 sm:h-64" watermarkSize={110} />

        <div className="mt-10 flex flex-wrap gap-2">
          {categories.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className="rounded-full border border-border-subtle px-4 py-2 text-xs uppercase tracking-widest text-muted transition-colors hover:border-gold hover:text-gold"
            >
              {c.name}
            </a>
          ))}
        </div>

        <div className="mt-16">
          <MenuList categories={categories} />
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
