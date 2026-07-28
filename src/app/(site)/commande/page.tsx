import type { Metadata } from "next";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { OrderBuilder } from "@/components/site/OrderBuilder";
import { getMenuByKind } from "@/lib/queries/menu";
import { LuxuryHero } from "@/components/site/LuxuryHero";

export const metadata: Metadata = {
  title: "Commander en ligne",
  description:
    "Composez votre commande à retirer sur place chez Hope Of Life : plats du restaurant et boissons du bar.",
};

export default async function OrderPage() {
  const [restaurantMenu, barMenu] = await Promise.all([
    getMenuByKind("restaurant"),
    getMenuByKind("bar"),
  ]);

  return (
    <>
      <LuxuryHero
        image="/hero/hero-cocktail.jpg"
        alt="Bar Hope Of Life"
        eyebrow="Commande en ligne"
        title="Votre expérience, à emporter"
        description="Parcourez une catégorie à la fois, composez votre sélection et choisissez votre heure de retrait."
      />
      <section className="py-16 sm:py-20">
        <Container>
          <div className="mb-8">
            <SectionHeading
              eyebrow="Sélection"
              title="Composez votre commande"
              description="Une navigation courte, sans listes interminables, pensée pour le mobile comme pour l’ordinateur."
            />
          </div>
          <OrderBuilder restaurantMenu={restaurantMenu} barMenu={barMenu} />
        </Container>
      </section>
    </>
  );
}
