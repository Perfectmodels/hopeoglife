"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";
import { roleLabels } from "@/lib/dashboard-nav";
import { ClockWidget } from "./ClockWidget";
import type { NavItem } from "@/lib/dashboard-nav";
import type { EmployeeRole } from "@/lib/auth/session";

export function Topbar({
  items,
  employeeName,
  role,
}: {
  items: NavItem[];
  employeeName: string;
  role: EmployeeRole;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "";
  const initials = employeeName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border-subtle bg-[#0b0b0c]/95 px-4 backdrop-blur sm:px-6">
        <button
          type="button"
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          aria-controls="dashboard-mobile-menu"
          onClick={() => setOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle text-champagne transition-colors hover:border-gold hover:text-gold lg:hidden"
        >
          <Menu size={24} />
        </button>

        <span className="font-display text-lg font-semibold tracking-[0.1em] text-gradient-gold lg:hidden">
          HOPE OF LIFE
        </span>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <ClockWidget />
          </div>
          <Link
            href="/dashboard/stock"
            aria-label="Consulter les alertes de stock"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle text-muted transition-colors hover:border-gold hover:text-gold"
          >
            <Bell size={17} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-[#0b0b0c]" />
          </Link>
          <Link
            href="/dashboard/compte"
            className="flex items-center gap-2.5 rounded-full border border-transparent p-1 pr-2 transition-colors hover:border-border-subtle hover:bg-surface-raised"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/50 bg-gold/[0.08] text-xs font-semibold text-gold-soft">
              {initials || "HL"}
            </span>
            <span className="hidden text-left md:block">
              <span className="block max-w-36 truncate text-xs font-semibold text-champagne">
                {employeeName}
              </span>
              <span className="block text-[0.68rem] text-muted">{roleLabels[role]}</span>
            </span>
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Se déconnecter"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle text-muted transition-colors hover:border-red-400/60 hover:text-red-300"
            >
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </header>

      {open ? (
        <div id="dashboard-mobile-menu" className="fixed inset-0 z-50 flex lg:hidden">
          <div className="dashboard-scrollbar w-[19rem] max-w-[86vw] overflow-y-auto border-r border-border-subtle bg-[#0b0b0c] p-5">
            <div className="mb-7 flex items-center justify-between">
              <span className="font-display text-lg font-semibold tracking-[0.1em] text-gradient-gold">
                HOPE OF LIFE
              </span>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle"
              >
                <X size={22} className="text-champagne" />
              </button>
            </div>
            <nav className="space-y-1 pb-5">
              {items.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block min-h-11 rounded-lg px-3 py-3 text-sm font-medium text-muted transition-colors hover:bg-surface-raised hover:text-champagne",
                      active && "bg-gold/[0.09] text-gold-soft"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/dashboard/compte"
                className={cn(
                  "block min-h-11 rounded-lg px-3 py-3 text-sm font-medium text-muted transition-colors hover:bg-surface-raised hover:text-champagne",
                  pathname.startsWith("/dashboard/compte") && "bg-gold/[0.09] text-gold-soft"
                )}
              >
                Mon compte
              </Link>
            </nav>
            <div className="border-t border-border-subtle pt-4 sm:hidden">
              <ClockWidget />
            </div>
          </div>
          <button
            type="button"
            aria-label="Fermer le menu"
            className="flex-1 bg-black/70"
            onClick={() => setOpen(false)}
          />
        </div>
      ) : null}
    </>
  );
}
