import type { Metadata } from "next";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ContactForm } from "@/components/site/ContactForm";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez Hope Of Life — coordonnées, localisation et formulaire de contact.",
};

export default function ContactPage() {
  return (
    <section className="py-24">
      <Container className="grid gap-16 lg:grid-cols-[1.2fr_1fr]">
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
          <div className="rounded-2xl border border-border-subtle bg-background-elevated p-8">
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
  );
}
