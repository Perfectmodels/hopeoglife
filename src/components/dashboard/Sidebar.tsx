"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  LayoutGrid,
  ClipboardList,
  ChefHat,
  Martini,
  Wallet,
  UtensilsCrossed,
  Boxes,
  Users,
  BarChart3,
  PackageCheck,
  CalendarClock,
  History,
  Truck,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/dashboard-nav";

const icons: Record<string, React.ElementType> = {
  "/dashboard": LayoutDashboard,
  "/dashboard/reservations": CalendarCheck,
  "/dashboard/salle": LayoutGrid,
  "/dashboard/commandes": ClipboardList,
  "/dashboard/cuisine": ChefHat,
  "/dashboard/bar": Martini,
  "/dashboard/caisse": Wallet,
  "/dashboard/menu": UtensilsCrossed,
  "/dashboard/stock": Boxes,
  "/dashboard/stock/receptions": PackageCheck,
  "/dashboard/stock/lots": CalendarClock,
  "/dashboard/stock/mouvements": History,
  "/dashboard/fournisseurs": Truck,
  "/dashboard/personnel": Users,
  "/dashboard/rapports": BarChart3,
};

export function Sidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname() ?? "";
  const activeHref = items
    .filter((item) =>
      item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <aside className="hidden w-[15.5rem] shrink-0 border-r border-border-subtle bg-[#0b0b0c] lg:flex lg:flex-col">
      <div className="flex h-28 items-center border-b border-border-subtle/80 px-6">
        <Link href="/dashboard" className="group flex items-center gap-3" aria-label="Hope Of Life">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 font-display text-xl font-semibold text-gold transition-colors group-hover:border-gold-soft group-hover:text-gold-soft">
            HL
          </span>
          <span>
            <span className="block font-display text-[1.05rem] font-semibold tracking-[0.14em] text-foreground">
              HOPE OF LIFE
            </span>
            <span className="mt-0.5 block text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-gold">
              Back-office
            </span>
          </span>
        </Link>
      </div>
      <nav className="dashboard-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const Icon = icons[item.href] ?? LayoutDashboard;
          const active = activeHref === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-[0.79rem] font-medium text-muted transition-all duration-150 hover:bg-surface-raised hover:text-foreground",
                active && "bg-gold/[0.09] text-gold-soft"
              )}
            >
              {active ? <span className="absolute inset-y-2 -left-3 w-0.5 rounded-full bg-gold" /> : null}
              <Icon
                size={17}
                strokeWidth={1.75}
                className={cn("shrink-0 transition-colors", active ? "text-gold" : "text-muted group-hover:text-gold-soft")}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border-subtle/80 px-3 py-4">
        <Link
          href="/dashboard/compte"
          aria-current={pathname.startsWith("/dashboard/compte") ? "page" : undefined}
          className={cn(
            "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-[0.79rem] font-medium text-muted transition-colors hover:bg-surface-raised hover:text-foreground",
            pathname.startsWith("/dashboard/compte") && "bg-gold/[0.09] text-gold-soft"
          )}
        >
          <Settings size={17} strokeWidth={1.75} />
          Mon compte
        </Link>
      </div>
    </aside>
  );
}
