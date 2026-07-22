"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
          onClick={() => setOpen((v) => !v)}
          className="text-champagne lg:hidden"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </Container>

      {open ? (
        <div className="border-t border-border-subtle/80 bg-background lg:hidden">
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
      ) : null}
    </header>
  );
}
