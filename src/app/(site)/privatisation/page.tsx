import type { Metadata } from "next";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { PrivatizationForm } from "@/components/site/PrivatizationForm";

export const metadata: Metadata = {
  title: "Privatisation",
  description:
    "Privatisez Hope Of Life pour votre anniversaire, mariage, dîner privé ou soirée d'entreprise à Angondjé.",
};

const occasionsList = [
  "Anniversaire",
  "Mariage",
  "Dîner privé",
  "Conférence",
  "Soirée d'entreprise",
  "Lancement de produit",
  "Réception",
  "Shooting",
  "Cérémonie",
];

export default function PrivatizationPage() {
  return (
    <section className="py-24">
      <Container className="grid gap-16 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <SectionHeading
            eyebrow="Privatisation"
            title="Privatisez Hope Of Life"
            description="Décrivez-nous votre projet, nous reviendrons vers vous avec une proposition et un devis personnalisé."
          />
          <div className="mt-12">
            <PrivatizationForm />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border-subtle bg-background-elevated p-8">
            <p className="font-display text-lg text-champagne">Occasions possibles</p>
            <ul className="mt-5 space-y-2 text-sm text-muted">
              {occasionsList.map((o) => (
                <li key={o} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-gold" />
                  {o}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-gold/30 bg-gold/5 p-8 text-sm leading-relaxed text-muted">
            Notre équipe étudie chaque demande individuellement : espace, menu, boissons,
            animations et équipements sont adaptés à votre événement.
          </div>
        </aside>
      </Container>
    </section>
  );
}
