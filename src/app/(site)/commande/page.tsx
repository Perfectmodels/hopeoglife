import type { Metadata } from "next";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { OrderBuilder } from "@/components/site/OrderBuilder";
import { getMenuByKind } from "@/lib/queries/menu";

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
    <section className="py-24">
      <Container>
        <SectionHeading
          eyebrow="Commande en ligne"
          title="Composez votre commande"
          description="Sélectionnez vos plats et boissons, choisissez votre heure de retrait : votre commande sera prête à votre arrivée."
        />
        <div className="mt-14">
          <OrderBuilder restaurantMenu={restaurantMenu} barMenu={barMenu} />
        </div>
      </Container>
    </section>
  );
}
