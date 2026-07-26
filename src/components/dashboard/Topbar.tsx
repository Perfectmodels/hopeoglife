"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
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

  return (
    <>
      <header className="flex h-20 items-center justify-between border-b border-border-subtle bg-background-elevated px-4 sm:px-6 lg:bg-background">
        <button
          type="button"
          aria-label="Ouvrir le menu"
          onClick={() => setOpen(true)}
          className="text-champagne lg:hidden"
        >
          <Menu size={24} />
        </button>

        <span className="font-display text-lg text-gradient-gold lg:hidden">Hope Of Life</span>

        <div className="ml-auto flex items-center gap-4">
          <ClockWidget />
          <Link href="/dashboard/compte" className="text-right transition-colors hover:opacity-80">
            <p className="text-sm text-champagne">{employeeName}</p>
            <p className="text-xs text-muted">{roleLabels[role]}</p>
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Se déconnecter"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle text-muted transition-colors hover:border-gold hover:text-gold"
            >
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-72 border-r border-border-subtle bg-background-elevated p-6">
            <div className="mb-8 flex items-center justify-between">
              <span className="font-display text-lg text-gradient-gold">Hope Of Life</span>
              <button type="button" aria-label="Fermer" onClick={() => setOpen(false)}>
                <X size={22} className="text-champagne" />
              </button>
            </div>
            <nav className="space-y-1">
              {items.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:bg-background hover:text-champagne",
                      active && "bg-gold/10 text-gold"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/dashboard/compte"
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:bg-background hover:text-champagne",
                  pathname.startsWith("/dashboard/compte") && "bg-gold/10 text-gold"
                )}
              >
                Mon compte
              </Link>
            </nav>
          </div>
          <div className="flex-1 bg-black/60" onClick={() => setOpen(false)} />
        </div>
      ) : null}
    </>
  );
}
