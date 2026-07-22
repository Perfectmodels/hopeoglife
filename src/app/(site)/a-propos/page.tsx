import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/site/Button";
import { BrandedVisual } from "@/components/site/BrandedVisual";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Découvrez l'histoire, la vision et les valeurs de Hope Of Life, bar lounge et restaurant de luxe à Angondjé.",
};

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
      <section className="relative overflow-hidden py-24">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(90% 70% at 50% 0%, rgba(201,162,74,0.14), transparent 60%)",
          }}
        />
        <Container className="relative flex flex-col items-center text-center">
          <Image
            src="/Logo.png"
            alt="Hope Of Life"
            width={140}
            height={158}
            priority
            className="mb-10 h-32 w-auto sm:h-36"
          />
          <SectionHeading
            eyebrow="Notre histoire"
            title={`${siteConfig.name}, l'art de recevoir`}
            description={`Situé à ${siteConfig.location}, ${siteConfig.name} est né de la volonté de créer un lieu unique à Libreville : un restaurant gastronomique et un bar lounge réunis dans un même écrin, où chaque détail est pensé pour offrir une expérience haut de gamme.`}
            align="center"
          />
        </Container>
      </section>

      <section className="border-t border-border-subtle/70 bg-background-elevated py-24">
        <Container className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            eyebrow="Notre vision"
            title="Un concept, deux univers"
            description="Le restaurant propose une cuisine raffinée mêlant saveurs locales et influences internationales. Le bar lounge invite à prolonger la soirée autour de cocktails signature, dans une ambiance feutrée aux tons dorés et cuivrés."
          />
          <div className="grid grid-cols-2 gap-4">
            <BrandedVisual label="Restaurant" className="aspect-[4/5]" />
            <BrandedVisual label="Bar Lounge" className="aspect-[4/5]" />
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

      <section className="border-t border-border-subtle/70 bg-background-elevated py-20">
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
