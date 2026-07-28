import type { Metadata } from "next";
import { Clock, Phone, MapPin } from "lucide-react";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ReservationForm } from "@/components/site/ReservationForm";
import { siteConfig } from "@/lib/site-config";
import { LuxuryHero } from "@/components/site/LuxuryHero";

export const metadata: Metadata = {
  title: "Réservation",
  description: "Réservez votre table au Hope Of Life, bar lounge et restaurant de luxe à Angondjé.",
};

export default function ReservationPage() {
  return (
    <>
      <LuxuryHero
        image="/hero/hero-terrace.jpg"
        alt="Terrasse lounge Hope Of Life"
        eyebrow="Réservation"
        title="Votre table vous attend"
        description="Dîner, soirée lounge ou moment privé : confiez-nous les détails, notre équipe vous confirme votre réservation."
      />
      <section className="py-16 sm:py-20">
      <Container className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.8fr)]">
        <div>
          <SectionHeading
            eyebrow="Réservation"
            title="Réservez votre table"
            description="Renseignez vos informations ci-dessous, notre équipe vous confirmera votre réservation par téléphone ou e-mail dans les meilleurs délais."
          />
          <div className="mt-12">
            <ReservationForm />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="onyx-panel rounded-2xl p-6 sm:p-8">
            <p className="font-display text-lg text-champagne">Informations pratiques</p>
            <div className="mt-6 space-y-5 text-sm text-muted">
              <div className="flex items-start gap-3">
                <Clock size={18} className="mt-0.5 shrink-0 text-gold" />
                <div>
                  {siteConfig.hours.map((h) => (
                    <p key={h.day}>
                      {h.day} : {h.hours}
                    </p>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-gold" />
                <p>{siteConfig.address}</p>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={18} className="mt-0.5 shrink-0 text-gold" />
                <a href={`tel:${siteConfig.phone}`} className="hover:text-champagne">
                  {siteConfig.phone}
                </a>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gold/30 bg-gold/5 p-8 text-sm leading-relaxed text-muted">
            Pour les groupes de plus de 15 personnes ou une privatisation d&apos;espace, merci de
            passer par notre{" "}
            <a href="/a-propos#privatisation" className="text-gold hover:underline">
              formulaire de privatisation
            </a>
            .
          </div>
        </aside>
      </Container>
      </section>
    </>
  );
}
