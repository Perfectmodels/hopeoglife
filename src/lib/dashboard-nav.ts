import type { EmployeeRole } from "@/lib/auth/session";

export type NavItem = {
  href: string;
  label: string;
  roles: EmployeeRole[];
};

export const dashboardNav: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", roles: ["admin", "manager", "caissier", "serveur", "cuisine", "bar", "stock"] },
  { href: "/dashboard/commandes", label: "Point de vente", roles: ["admin", "manager", "serveur", "caissier"] },
  { href: "/dashboard/salle", label: "Tables & salles", roles: ["admin", "manager", "serveur"] },
  { href: "/dashboard/cuisine", label: "Cuisine", roles: ["admin", "manager", "cuisine"] },
  { href: "/dashboard/bar", label: "Bar", roles: ["admin", "manager", "bar"] },
  { href: "/dashboard/reservations", label: "Réservations", roles: ["admin", "manager", "serveur"] },
  { href: "/dashboard/caisse", label: "Caisse", roles: ["admin", "manager", "caissier"] },
  { href: "/dashboard/menu", label: "Catalogue", roles: ["admin", "manager"] },
  { href: "/dashboard/stock", label: "Stocks", roles: ["admin", "manager", "stock"] },
  { href: "/dashboard/stock/receptions", label: "Réceptions", roles: ["admin", "manager", "stock", "caissier"] },
  { href: "/dashboard/stock/lots", label: "Lots et expirations", roles: ["admin", "manager", "stock"] },
  { href: "/dashboard/stock/mouvements", label: "Mouvements", roles: ["admin", "manager", "stock"] },
  { href: "/dashboard/fournisseurs", label: "Fournisseurs", roles: ["admin", "manager", "stock"] },
  { href: "/dashboard/personnel", label: "Personnel", roles: ["admin", "manager"] },
  { href: "/dashboard/rapports", label: "Rapports", roles: ["admin", "manager"] },
];

export function navForRole(role: EmployeeRole): NavItem[] {
  return dashboardNav.filter((item) => item.roles.includes(role));
}

export const roleLabels: Record<EmployeeRole, string> = {
  admin: "Administrateur",
  manager: "Manager",
  caissier: "Caissier",
  serveur: "Serveur",
  cuisine: "Cuisine",
  bar: "Bar",
  stock: "Stock",
};
