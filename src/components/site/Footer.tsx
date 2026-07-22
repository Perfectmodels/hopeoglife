import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, Clock, LogIn } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { Container } from "./Container";

function InstagramGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

function FacebookGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14.5 21v-7.5h2.5l.4-3H14.5V8.4c0-.9.25-1.5 1.55-1.5H17.5V4.3C17.2 4.26 16.24 4.17 15.1 4.17c-2.3 0-3.9 1.4-3.9 4v2.33H8.7v3h2.5V21h3.3Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const exploreLinks = [
  { href: "/menu", label: "Menu" },
  { href: "/menu?tab=bar", label: "Carte du bar" },
  { href: "/evenements", label: "Événements" },
  { href: "/evenements#galerie", label: "Galerie" },
];

const serviceLinks = [
  { href: "/reservation", label: "Réserver une table" },
  { href: "/commande", label: "Commander en ligne" },
  { href: "/a-propos", label: "À propos" },
  { href: "/a-propos#privatisation", label: "Privatisation" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="border-t border-border-subtle/80 bg-background-elevated">
      <Container className="grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Image src="/Logo.png" alt="Hope Of Life" width={64} height={72} className="h-16 w-auto" />
          <p className="mt-3 text-sm leading-relaxed text-muted">{siteConfig.tagline}</p>
          <div className="mt-5 flex gap-4">
            <a
              href={siteConfig.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-muted transition-colors hover:text-gold"
            >
              <InstagramGlyph />
            </a>
            <a
              href={siteConfig.socials.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-muted transition-colors hover:text-gold"
            >
              <FacebookGlyph />
            </a>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold">Explorer</p>
          <ul className="mt-4 space-y-3">
            {exploreLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-muted hover:text-champagne">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold">Services</p>
          <ul className="mt-4 space-y-3">
            {serviceLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-muted hover:text-champagne">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold">Contact</p>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-gold" />
              <span>{siteConfig.address}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} className="shrink-0 text-gold" />
              <a href={`tel:${siteConfig.phone}`} className="hover:text-champagne">
                {siteConfig.phone}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} className="shrink-0 text-gold" />
              <a href={`mailto:${siteConfig.email}`} className="hover:text-champagne">
                {siteConfig.email}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Clock size={16} className="mt-0.5 shrink-0 text-gold" />
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
      </Container>

      <div className="border-t border-border-subtle/80 py-6">
        <Container className="flex flex-col items-center justify-between gap-4 text-xs text-muted sm:flex-row">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
            <p>
              © {new Date().getFullYear()} {siteConfig.name}. Tous droits réservés.
            </p>
            <p>{siteConfig.location}</p>
          </div>
          <Link
            href="/connexion"
            className="flex items-center gap-2 rounded-full border border-border-subtle px-4 py-2 text-xs text-muted transition-colors hover:border-gold hover:text-gold"
          >
            <LogIn size={14} />
            Espace staff
          </Link>
        </Container>
      </div>
    </footer>
  );
}
