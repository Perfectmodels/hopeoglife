import Image from "next/image";
import { MapPin, Clock, Phone, ArrowRight } from "lucide-react";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/site/Button";
import { BrandedVisual } from "@/components/site/BrandedVisual";
import { HeroCarousel, type HeroSlide } from "@/components/site/HeroCarousel";
import { Reveal } from "@/components/site/Reveal";
import { getMenuByKind } from "@/lib/queries/menu";
import { getUpcomingEvents } from "@/lib/queries/events";
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
      <section className="relative isolate flex min-h-[calc(100svh-4.5rem)] items-center overflow-hidden border-b border-gold/20 py-16 sm:min-h-[calc(100svh-6.5rem)] sm:py-20">
        <HeroCarousel slides={heroSlides} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,3,4,.96)_0%,rgba(3,3,4,.72)_52%,rgba(3,3,4,.3)_100%)]" />
        <div className="luxury-grid absolute inset-0 opacity-20" />
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
        <Container className="relative grid items-end gap-12 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div>
            <p
              className="hero-rise luxury-kicker"
              style={{ "--hero-delay": "100ms" } as React.CSSProperties}
            >
              Restaurant · Bar · Lounge
            </p>
            <h1
              className="hero-rise mt-5 max-w-4xl font-display text-5xl font-semibold leading-[0.92] tracking-[-0.045em] text-champagne sm:text-7xl lg:text-8xl"
              style={{ "--hero-delay": "250ms" } as React.CSSProperties}
            >
              L&apos;élégance <span className="text-gradient-gold">Onyx & Or</span>, jusque dans
              l&apos;assiette.
            </h1>
            <p
              className="hero-rise mt-6 max-w-2xl text-base leading-7 text-champagne/70 sm:text-lg"
              style={{ "--hero-delay": "400ms" } as React.CSSProperties}
            >
              {siteConfig.description} Une adresse pensée pour dîner, célébrer et prolonger la nuit.
            </p>
            <div
              className="hero-rise mt-8 flex flex-wrap gap-3"
              style={{ "--hero-delay": "550ms" } as React.CSSProperties}
            >
              <ButtonLink href="/reservation">
                Réserver une table <ArrowRight size={16} />
              </ButtonLink>
              <ButtonLink href="/menu?tab=bar" variant="outline">
                Découvrir la carte
              </ButtonLink>
            </div>
          </div>

          <aside
            className="onyx-panel gold-frame hero-rise hidden rounded-2xl p-6 xl:block"
            style={{ "--hero-delay": "650ms" } as React.CSSProperties}
          >
            <Image
              src="/Logo.png"
              alt=""
              aria-hidden
              width={72}
              height={81}
              className="h-16 w-auto"
            />
            <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">
              Votre soirée
            </p>
            <p className="mt-3 font-display text-2xl leading-tight text-champagne">
              Un service attentif dans un cadre confidentiel.
            </p>
            <div className="mt-6 space-y-3 border-t border-gold/15 pt-5 text-xs text-muted">
              <p className="flex items-center justify-between gap-3">
                <span>Adresse</span>
                <span className="text-right text-champagne">{siteConfig.location}</span>
              </p>
              <p className="flex items-center justify-between gap-3">
                <span>Réservation</span>
                <span className="text-champagne">{siteConfig.phone}</span>
              </p>
            </div>
          </aside>
        </Container>
      </section>

      {/* Intro */}
      <section className="py-16 sm:py-20">
        <Container className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <SectionHeading
              eyebrow="L'établissement"
              title="Bienvenue chez Hope Of Life"
              description="Niché à Antraco, Angondjé, Hope Of Life réunit dans un même lieu un restaurant gastronomique et un bar lounge à l'ambiance feutrée. Une carte raffinée, des cocktails signature et un service attentionné pour des soirées mémorables."
            />
          </Reveal>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Cuisine gastronomique", value: "Chef & brigade dédiés" },
              { label: "Bar lounge", value: "Cocktails signature" },
              { label: "Espaces VIP", value: "Privatisation sur mesure" },
              { label: "Soirées à thème", value: "Événements réguliers" },
            ].map((item, i) => (
              <Reveal key={item.label} delay={i * 90}>
                <div className="onyx-panel rounded-2xl p-5 sm:p-6">
                  <p className="font-display text-lg text-gold-soft">{item.value}</p>
                  <p className="mt-1 text-sm text-muted">{item.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Spécialités */}
      {specialties.length > 0 ? (
        <section className="border-t border-gold/15 bg-black/15 py-16 sm:py-20">
          <Container>
            <Reveal>
              <SectionHeading
                eyebrow="Spécialités du chef"
                title="Les plats signature du moment"
                align="center"
              />
            </Reveal>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {specialties.concat(signatureCocktails.slice(0, 1)).map((item, i) => (
                <Reveal key={item.id} delay={i * 100}>
                  <div className="onyx-panel group rounded-2xl p-5 transition-colors hover:border-gold/50">
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
                </Reveal>
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
      <section className="py-16 sm:py-20">
        <Container>
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading eyebrow="À l'affiche" title="Événements à venir" />
              <ButtonLink href="/evenements" variant="ghost">
                Tous les événements <ArrowRight size={16} />
              </ButtonLink>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {events.slice(0, 2).map((event, i) => (
              <Reveal key={event.id} delay={i * 100}>
                <div className="onyx-panel rounded-2xl p-6 sm:p-8">
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
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Galerie preview */}
      <section className="border-t border-gold/15 bg-black/15 py-16 sm:py-20">
        <Container>
          <Reveal>
            <SectionHeading eyebrow="Ambiance" title="Un aperçu du lieu" align="center" />
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { id: "g1", label: "Salle principale", src: "/hero/hero-gallery-1.jpg" },
              { id: "g2", label: "Bar & mixologie", src: "/hero/hero-cocktail.jpg" },
              { id: "g3", label: "Terrasse lounge", src: "/hero/hero-terrace.jpg" },
              { id: "g4", label: "Espace VIP", src: "/hero/hero-gallery-2.jpg" },
            ].map((item, i) => (
              <Reveal key={item.id} delay={i * 80}>
                <div className="group relative aspect-square overflow-hidden rounded-2xl border border-border-subtle">
                  <Image
                    src={item.src}
                    alt={item.label}
                    fill
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <p className="text-center text-[11px] uppercase tracking-[0.2em] text-champagne">
                      {item.label}
                    </p>
                  </div>
                </div>
              </Reveal>
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
      <section className="py-16 sm:py-20">
        <Container className="grid gap-8 sm:grid-cols-3">
          <Reveal className="flex items-start gap-4">
            <Clock className="mt-1 shrink-0 text-gold" size={22} />
            <div>
              <p className="font-display text-lg text-champagne">Horaires</p>
              {siteConfig.hours.map((h) => (
                <p key={h.day} className="mt-1 text-sm text-muted">
                  {h.day} : {h.hours}
                </p>
              ))}
            </div>
          </Reveal>
          <Reveal delay={80} className="flex items-start gap-4">
            <MapPin className="mt-1 shrink-0 text-gold" size={22} />
            <div>
              <p className="font-display text-lg text-champagne">Localisation</p>
              <p className="mt-1 text-sm text-muted">{siteConfig.address}</p>
            </div>
          </Reveal>
          <Reveal delay={160} className="flex items-start gap-4">
            <Phone className="mt-1 shrink-0 text-gold" size={22} />
            <div>
              <p className="font-display text-lg text-champagne">Contact</p>
              <p className="mt-1 text-sm text-muted">{siteConfig.phone}</p>
              <p className="text-sm text-muted">{siteConfig.email}</p>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
