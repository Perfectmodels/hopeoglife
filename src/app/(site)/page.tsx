import Image from "next/image";
import { MapPin, Clock, Phone, ArrowRight } from "lucide-react";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/site/Button";
import { BrandedVisual } from "@/components/site/BrandedVisual";
import { HeroCarousel, type HeroSlide } from "@/components/site/HeroCarousel";
import { getMenuByKind } from "@/lib/queries/menu";
import { getUpcomingEvents } from "@/lib/queries/events";
import { galleryPlaceholders } from "@/lib/demo-data";
import { siteConfig } from "@/lib/site-config";
import { formatXAF } from "@/lib/utils";

export default async function HomePage() {
  const [restaurantMenu, barMenu, events] = await Promise.all([
    getMenuByKind("restaurant"),
    getMenuByKind("bar"),
    getUpcomingEvents(),
  ]);

  const specialties = restaurantMenu.flatMap((c) => c.items).filter((i) => i.isDailySpecial);
  const signatureCocktails = barMenu.flatMap((c) => c.items).slice(0, 3);

  const photographedItems = [...specialties, ...signatureCocktails].filter((i) => i.imageUrl);
  const heroSlides: HeroSlide[] =
    photographedItems.length > 0
      ? photographedItems
          .slice(0, 5)
          .map((i) => ({ id: i.id, imageUrl: i.imageUrl, caption: i.name }))
      : [{ id: "brand" }];

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[85vh] items-center overflow-hidden">
        <HeroCarousel slides={heroSlides} />
        {heroSlides.length === 1 && !heroSlides[0].imageUrl ? (
          <Image
            src="/Logo.png"
            alt=""
            aria-hidden
            width={620}
            height={697}
            priority
            className="pointer-events-none absolute -right-24 top-1/2 hidden -translate-y-1/2 opacity-[0.08] lg:block xl:-right-10"
          />
        ) : null}
        <Container className="relative">
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.4em] text-gold">
            {siteConfig.location}
          </p>
          <h1 className="max-w-3xl font-display text-5xl font-semibold leading-tight text-foreground sm:text-6xl">
            Une expérience <span className="text-gradient-gold">lounge</span> et gastronomique
            d&apos;exception
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            {siteConfig.description}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <ButtonLink href="/reservation">
              Réserver une table <ArrowRight size={16} />
            </ButtonLink>
            <ButtonLink href="/commande" variant="outline">
              Commander en ligne
            </ButtonLink>
          </div>
        </Container>
      </section>

      {/* Intro */}
      <section className="py-24">
        <Container className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            eyebrow="L'établissement"
            title="Bienvenue chez Hope Of Life"
            description="Niché à Antraco, Angondjé, Hope Of Life réunit dans un même lieu un restaurant gastronomique et un bar lounge à l'ambiance feutrée. Une carte raffinée, des cocktails signature et un service attentionné pour des soirées mémorables."
          />
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Cuisine gastronomique", value: "Chef & brigade dédiés" },
              { label: "Bar lounge", value: "Cocktails signature" },
              { label: "Espaces VIP", value: "Privatisation sur mesure" },
              { label: "Soirées à thème", value: "Événements réguliers" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-border-subtle bg-background-elevated p-6"
              >
                <p className="font-display text-lg text-gold-soft">{item.value}</p>
                <p className="mt-1 text-sm text-muted">{item.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Spécialités */}
      {specialties.length > 0 ? (
        <section className="border-t border-border-subtle/70 bg-background-elevated py-24">
          <Container>
            <SectionHeading
              eyebrow="Spécialités du chef"
              title="Les plats signature du moment"
              align="center"
            />
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {specialties.concat(signatureCocktails.slice(0, 1)).map((item) => (
                <div
                  key={item.id}
                  className="group rounded-2xl border border-border-subtle bg-background p-6 transition-colors hover:border-gold/50"
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={400}
                      height={288}
                      className="mb-5 h-36 w-full rounded-xl object-cover"
                    />
                  ) : (
                    <BrandedVisual className="mb-5 h-36" watermarkSize={64} />
                  )}
                  <h3 className="font-display text-lg text-champagne">{item.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
                  <p className="mt-4 text-sm font-medium text-gold">{formatXAF(item.price)}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 flex justify-center gap-4">
              <ButtonLink href="/menu" variant="outline">
                Voir le menu complet
              </ButtonLink>
              <ButtonLink href="/menu?tab=bar" variant="ghost">
                Voir la carte du bar
              </ButtonLink>
            </div>
          </Container>
        </section>
      ) : null}

      {/* Événements */}
      <section className="py-24">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow="À l'affiche" title="Événements à venir" />
            <ButtonLink href="/evenements" variant="ghost">
              Tous les événements <ArrowRight size={16} />
            </ButtonLink>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {events.slice(0, 2).map((event) => (
              <div
                key={event.id}
                className="rounded-2xl border border-border-subtle bg-background-elevated p-8"
              >
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-gold">
                  {new Date(event.date).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "long",
                  })}{" "}
                  · {event.time}
                </p>
                <h3 className="mt-3 font-display text-xl text-champagne">{event.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{event.description}</p>
                <p className="mt-4 text-sm text-gold-soft">{event.priceInfo}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Galerie preview */}
      <section className="border-t border-border-subtle/70 bg-background-elevated py-24">
        <Container>
          <SectionHeading eyebrow="Ambiance" title="Un aperçu du lieu" align="center" />
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {galleryPlaceholders.slice(0, 4).map((item) => (
              <BrandedVisual key={item.id} label={item.label} className="aspect-square" />
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <ButtonLink href="/evenements#galerie" variant="outline">
              Voir la galerie
            </ButtonLink>
          </div>
        </Container>
      </section>

      {/* Infos pratiques */}
      <section className="py-24">
        <Container className="grid gap-8 sm:grid-cols-3">
          <div className="flex items-start gap-4">
            <Clock className="mt-1 shrink-0 text-gold" size={22} />
            <div>
              <p className="font-display text-lg text-champagne">Horaires</p>
              {siteConfig.hours.map((h) => (
                <p key={h.day} className="mt-1 text-sm text-muted">
                  {h.day} : {h.hours}
                </p>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-4">
            <MapPin className="mt-1 shrink-0 text-gold" size={22} />
            <div>
              <p className="font-display text-lg text-champagne">Localisation</p>
              <p className="mt-1 text-sm text-muted">{siteConfig.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Phone className="mt-1 shrink-0 text-gold" size={22} />
            <div>
              <p className="font-display text-lg text-champagne">Contact</p>
              <p className="mt-1 text-sm text-muted">{siteConfig.phone}</p>
              <p className="text-sm text-muted">{siteConfig.email}</p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
