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
  UserCircle,
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
  "/dashboard/personnel": Users,
};

export function Sidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname() ?? "";

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border-subtle bg-background-elevated lg:flex lg:flex-col">
      <div className="flex h-20 items-center px-6">
        <Link href="/dashboard" className="font-display text-lg font-semibold text-gradient-gold">
          Hope Of Life
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-2">
        {items.map((item) => {
          const Icon = icons[item.href] ?? LayoutDashboard;
          const active =
            item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:bg-background hover:text-champagne",
                active && "bg-gold/10 text-gold"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 pb-4">
        <Link
          href="/dashboard/compte"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:bg-background hover:text-champagne",
            pathname.startsWith("/dashboard/compte") && "bg-gold/10 text-gold"
          )}
        >
          <UserCircle size={18} />
          Mon compte
        </Link>
      </div>
    </aside>
  );
}
