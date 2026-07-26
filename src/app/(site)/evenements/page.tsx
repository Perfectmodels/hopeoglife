import type { Metadata } from "next";
import Image from "next/image";
import { CalendarDays, Clock3 } from "lucide-react";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/site/Button";
import { getUpcomingEvents } from "@/lib/queries/events";

export const metadata: Metadata = {
  title: "Événements",
  description:
    "Soirées lounge, brunchs et événements à thème chez Hope Of Life, bar lounge et restaurant de luxe à Angondjé. Découvrez aussi notre galerie photo.",
};

const galleryImages = [
  { id: "g1", label: "Salle principale", src: "/hero/hero-gallery-1.jpg" },
  { id: "g2", label: "Bar & mixologie", src: "/hero/hero-cocktail.jpg" },
  { id: "g3", label: "Terrasse lounge", src: "/hero/hero-terrace.jpg" },
  { id: "g4", label: "Espace VIP", src: "/hero/hero-gallery-2.jpg" },
  { id: "g5", label: "Nos plats", src: "/menu/p1.jpg" },
  { id: "g6", label: "Nos cocktails", src: "/menu/c1.jpg" },
  { id: "g7", label: "Soirées à thème", src: "/menu/c2.jpg" },
  { id: "g8", label: "Coucher de soleil", src: "/hero/hero-cocktail.jpg" },
];

export default async function EventsPage() {
  const events = await getUpcomingEvents();

  return (
    <>
      {/* Hero bannière */}
      <div className="relative overflow-hidden bg-background">
        <Image
          src="/hero/hero-gallery-2.jpg"
          alt="Soirée événement Hope Of Life"
          width={1920}
          height={600}
          className="h-56 w-full object-cover sm:h-72 lg:h-96"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Container className="text-center">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-gold">
              À l&apos;affiche
            </p>
            <h1 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">
              Nos événements
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted">
              Soirées lounge, brunchs dominicaux, concerts et soirées à thème : suivez notre
              programmation et réservez votre place.
            </p>
            <div className="divider-gold mx-auto mt-6 h-px w-16" />
          </Container>
        </div>
      </div>

      <section className="py-24">
        <Container>
          <div className="space-y-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="overflow-hidden rounded-2xl border border-border-subtle bg-background-elevated"
              >
                <Image
                  src="/hero/hero-event.png"
                  alt=""
                  width={1200}
                  height={200}
                  className="h-36 w-full object-cover"
                />
                <div className="flex flex-col gap-6 p-8 sm:flex-row sm:items-center">
                  <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-xl border border-gold/30 bg-gold/5 text-gold">
                    <span className="text-2xl font-semibold">
                      {new Date(event.date).getDate()}
                    </span>
                    <span className="text-xs uppercase tracking-widest">
                      {new Date(event.date).toLocaleDateString("fr-FR", { month: "short" })}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-xl text-champagne">{event.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{event.description}</p>
                    <div className="mt-4 flex flex-wrap gap-4 text-xs uppercase tracking-widest text-muted">
                      <span className="flex items-center gap-2">
                        <CalendarDays size={14} className="text-gold" />
                        {new Date(event.date).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                        })}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock3 size={14} className="text-gold" />
                        {event.time}
                      </span>
                      <span className="text-gold-soft">{event.priceInfo}</span>
                    </div>
                  </div>
                  <ButtonLink href="/reservation" variant="outline" className="shrink-0">
                    Réserver ma place
                  </ButtonLink>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 rounded-2xl border border-gold/30 bg-gold/5 p-8 text-center">
            <p className="font-display text-xl text-champagne">
              Vous organisez un événement privé ?
            </p>
            <p className="mt-2 text-sm text-muted">
              Découvrez nos offres de privatisation pour vos occasions spéciales.
            </p>
            <ButtonLink href="/a-propos#privatisation" className="mt-6 inline-flex">
              Demander une privatisation
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className="border-t border-border-subtle/70 py-24">
        <Container id="galerie" className="scroll-mt-24">
          <SectionHeading
            eyebrow="Galerie"
            title="L'univers Hope Of Life"
            description="Plongez dans l'ambiance de notre établissement à travers ces photos."
            align="center"
          />
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {galleryImages.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-border-subtle"
              >
                <Image
                  src={item.src}
                  alt={item.label}
                  fill
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <p className="text-center text-xs uppercase tracking-[0.2em] text-champagne">
                    {item.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
