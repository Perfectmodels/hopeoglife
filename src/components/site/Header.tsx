"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonLink } from "./Button";
import { Container } from "./Container";

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
    <header className="sticky top-0 z-50 border-b border-border-subtle/80 bg-background/90 backdrop-blur">
      <Container className="flex h-20 items-center justify-between">
        <Link href="/" aria-label="Hope Of Life — Accueil" className="flex items-center">
          <Image
            src="/Logo.png"
            alt="Hope Of Life"
            width={56}
            height={63}
            priority
            className="h-14 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
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

        <div className="hidden items-center lg:flex">
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
          className="relative flex h-11 w-11 shrink-0 items-center justify-center text-champagne lg:hidden"
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
          "overflow-hidden border-t border-border-subtle/80 bg-background transition-[max-height,opacity] duration-300 [transition-timing-function:var(--ease-out-quart)] lg:hidden",
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
