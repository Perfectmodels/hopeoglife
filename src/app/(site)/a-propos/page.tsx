import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/site/Button";
import { PrivatizationForm } from "@/components/site/PrivatizationForm";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Découvrez l'histoire, la vision et les valeurs de Hope Of Life, bar lounge et restaurant de luxe à Angondjé, et privatisez le lieu pour vos occasions spéciales.",
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

const values = [
  {
    title: "Exigence",
    description: "Une carte pensée avec soin, des produits sélectionnés et un service irréprochable.",
  },
  {
    title: "Élégance",
    description: "Un cadre raffiné, pensé pour sublimer chaque instant, du dîner d'affaires à la soirée entre amis.",
  },
  {
    title: "Chaleur",
    description: "Un accueil sincère et attentionné, à l'image de l'hospitalité gabonaise.",
  },
  {
    title: "Exclusivité",
    description: "Des espaces VIP et des expériences sur mesure pour les occasions qui comptent.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero bannière */}
      <div className="relative overflow-hidden bg-background">
        <Image
          src="/hero/hero-gallery-2.jpg"
          alt="Ambiance lounge Hope Of Life"
          width={1920}
          height={600}
          className="h-56 w-full object-cover sm:h-72 lg:h-96"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Container className="flex flex-col items-center text-center">
            <Image
              src="/Logo.png"
              alt="Hope Of Life"
              width={100}
              height={113}
              priority
              className="mb-6 h-20 w-auto opacity-90 sm:h-24"
            />
            <SectionHeading
              eyebrow="Notre histoire"
              title={`${siteConfig.name}, l'art de recevoir`}
              description={`Situé à ${siteConfig.location}, ${siteConfig.name} est né de la volonté de créer un lieu unique à Libreville : un restaurant gastronomique et un bar lounge réunis dans un même écrin, où chaque détail est pensé pour offrir une expérience haut de gamme.`}
              align="center"
            />
          </Container>
        </div>
      </div>

      <section className="border-t border-border-subtle/70 bg-background-elevated py-24">
        <Container className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            eyebrow="Notre vision"
            title="Un concept, deux univers"
            description="Le restaurant propose une cuisine raffinée mêlant saveurs locales et influences internationales. Le bar lounge invite à prolonger la soirée autour de cocktails signature, dans une ambiance feutrée aux tons dorés et cuivrés."
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border-subtle">
              <Image
                src="/hero/hero-gallery-1.jpg"
                alt="Restaurant Hope Of Life"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-center text-xs uppercase tracking-[0.2em] text-muted">Restaurant</p>
              </div>
            </div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border-subtle">
              <Image
                src="/hero/hero-cocktail.jpg"
                alt="Bar Lounge Hope Of Life"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-center text-xs uppercase tracking-[0.2em] text-muted">Bar Lounge</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-24">
        <Container>
          <SectionHeading eyebrow="Nos valeurs" title="Ce qui nous anime" align="center" />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-2xl border border-border-subtle bg-background-elevated p-6 text-center"
              >
                <p className="font-display text-lg text-gold-soft">{value.title}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">{value.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section id="privatisation" className="scroll-mt-24 border-t border-border-subtle/70 bg-background-elevated py-24">
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
            <div className="rounded-2xl border border-border-subtle bg-background p-8">
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

      <section className="border-t border-border-subtle/70 py-20">
        <Container className="flex flex-col items-center gap-6 text-center">
          <p className="font-display text-2xl text-champagne">
            Venez vivre l&apos;expérience Hope Of Life
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <ButtonLink href="/reservation">Réserver une table</ButtonLink>
            <ButtonLink href="/contact" variant="outline">
              Nous contacter
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
