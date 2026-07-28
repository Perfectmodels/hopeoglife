import type { Metadata } from "next";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ContactForm } from "@/components/site/ContactForm";
import { siteConfig } from "@/lib/site-config";
import { LuxuryHero } from "@/components/site/LuxuryHero";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez Hope Of Life — coordonnées, localisation et formulaire de contact.",
};

export default function ContactPage() {
  return (
    <>
      <LuxuryHero
        image="/hero/hero-gallery-1.jpg"
        alt="Intérieur Hope Of Life"
        eyebrow="Contact"
        title="Parlons de votre prochaine soirée"
        description="Une réservation spéciale, une privatisation ou une simple question : notre équipe est à votre écoute."
      />
      <section className="py-16 sm:py-20">
      <Container className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.9fr)]">
        <div>
          <SectionHeading
            eyebrow="Contact"
            title="Une question, une demande ?"
            description="Écrivez-nous, notre équipe vous répondra dans les meilleurs délais."
          />
          <div className="mt-12">
            <ContactForm />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="onyx-panel rounded-2xl p-6 sm:p-8">
            <p className="font-display text-lg text-champagne">Coordonnées</p>
            <ul className="mt-6 space-y-4 text-sm text-muted">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-gold" />
                {siteConfig.address}
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="shrink-0 text-gold" />
                <a href={`tel:${siteConfig.phone}`} className="hover:text-champagne">
                  {siteConfig.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="shrink-0 text-gold" />
                <a href={`mailto:${siteConfig.email}`} className="hover:text-champagne">
                  {siteConfig.email}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MessageCircle size={18} className="shrink-0 text-gold" />
                <a
                  href={`https://wa.me/${siteConfig.whatsapp.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-champagne"
                >
                  WhatsApp
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={18} className="mt-0.5 shrink-0 text-gold" />
                <span>
                  {siteConfig.hours.map((h) => (
                    <span key={h.day} className="block">
                      {h.day} : {h.hours}
                    </span>
                  ))}
                </span>
              </li>
            </ul>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border-subtle">
            <iframe
              title="Localisation Hope Of Life"
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                siteConfig.mapsQuery
              )}&output=embed`}
              className="h-72 w-full grayscale invert-[0.92] contrast-[0.9]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </aside>
      </Container>
      </section>
    </>
  );
}
