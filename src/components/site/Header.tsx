"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MapPin, Menu, Phone, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonLink } from "./Button";
import { Container } from "./Container";
import { siteConfig } from "@/lib/site-config";

const navLinks = [
  { href: "/a-propos", label: "À propos" },
  { href: "/menu", label: "Menu" },
  { href: "/evenements", label: "Événements" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Ferme le menu à chaque changement de page (ex: retour navigateur) et
  // empêche le fond de défiler pendant qu'il est ouvert.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-gold/20 bg-[#050506]/92 shadow-[0_12px_50px_rgba(0,0,0,.35)] backdrop-blur-xl">
      <div className="hidden border-b border-white/[0.04] sm:block">
        <Container className="flex h-8 items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted">
          <span className="flex items-center gap-2">
            <MapPin size={11} className="text-gold" />
            {siteConfig.location}
          </span>
          <a href={`tel:${siteConfig.phone}`} className="flex items-center gap-2 hover:text-gold">
            <Phone size={11} className="text-gold" />
            {siteConfig.phone}
          </a>
        </Container>
      </div>
      <Container className="flex h-[4.5rem] items-center justify-between">
        <Link href="/" aria-label="Hope Of Life — Accueil" className="flex min-w-0 items-center gap-3">
          <Image
            src="/Logo.png"
            alt="Hope Of Life"
            width={56}
            height={63}
            priority
            className="h-12 w-auto"
          />
          <span className="hidden min-w-0 sm:block">
            <span className="block font-display text-lg font-semibold leading-none text-champagne">
              Hope Of Life
            </span>
            <span className="mt-1 block text-[8px] uppercase tracking-[0.28em] text-gold">
              Restaurant · Bar · Lounge
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 xl:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm tracking-wide text-muted transition-colors hover:text-gold",
                  active && "text-gold"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center xl:flex">
          <ButtonLink href="/reservation" variant="primary">
            Réserver une table
          </ButtonLink>
        </div>

        <button
          type="button"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          aria-controls="mobile-nav-panel"
          onClick={() => setOpen((v) => !v)}
          className="relative flex h-11 w-11 shrink-0 items-center justify-center text-champagne xl:hidden"
        >
          <Menu
            size={26}
            className={cn(
              "absolute transition-all duration-300 [transition-timing-function:var(--ease-out-quart)]",
              open ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
            )}
          />
          <X
            size={26}
            className={cn(
              "absolute transition-all duration-300 [transition-timing-function:var(--ease-out-quart)]",
              open ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
            )}
          />
        </button>
      </Container>

      <div
        id="mobile-nav-panel"
        className={cn(
          "overflow-hidden border-t border-border-subtle/80 bg-[#070708] transition-[max-height,opacity] duration-300 [transition-timing-function:var(--ease-out-quart)] xl:hidden",
          open ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <Container className="flex flex-col gap-1 py-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "rounded-lg px-3 py-3 text-sm text-muted transition-colors hover:bg-background-elevated hover:text-gold",
                pathname === link.href && "text-gold"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 px-3">
            <ButtonLink href="/reservation" variant="primary" onClick={() => setOpen(false)}>
              Réserver une table
            </ButtonLink>
          </div>
        </Container>
      </div>
    </header>
  );
}
