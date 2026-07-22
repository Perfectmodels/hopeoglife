import type { Metadata } from "next";
import { CalendarDays, Clock3 } from "lucide-react";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/site/Button";
import { BrandedVisual } from "@/components/site/BrandedVisual";
import { getUpcomingEvents } from "@/lib/queries/events";

export const metadata: Metadata = {
  title: "Événements",
  description:
    "Soirées lounge, brunchs et événements à thème chez Hope Of Life, bar lounge et restaurant de luxe à Angondjé.",
};

export default async function EventsPage() {
  const events = await getUpcomingEvents();

  return (
    <section className="py-24">
      <Container>
        <SectionHeading
          eyebrow="À l'affiche"
          title="Nos événements"
          description="Soirées lounge, brunchs dominicaux, concerts et soirées à thème : suivez notre programmation et réservez votre place."
        />

        <div className="mt-16 space-y-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="overflow-hidden rounded-2xl border border-border-subtle bg-background-elevated"
            >
              <BrandedVisual className="h-36 w-full rounded-none border-0" watermarkSize={72} />
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
          <ButtonLink href="/privatisation" className="mt-6 inline-flex">
            Demander une privatisation
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
