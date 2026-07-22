import type { EmployeeRole } from "@/lib/auth/session";

export type NavItem = {
  href: string;
  label: string;
  roles: EmployeeRole[];
};

export const dashboardNav: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", roles: ["admin", "manager", "caissier", "serveur", "cuisine", "bar", "stock"] },
  { href: "/dashboard/reservations", label: "Réservations", roles: ["admin", "manager", "serveur"] },
  { href: "/dashboard/salle", label: "Plan de salle", roles: ["admin", "manager", "serveur"] },
  { href: "/dashboard/commandes", label: "Commandes", roles: ["admin", "manager", "serveur", "caissier"] },
  { href: "/dashboard/cuisine", label: "Cuisine", roles: ["admin", "manager", "cuisine"] },
  { href: "/dashboard/bar", label: "Bar", roles: ["admin", "manager", "bar"] },
  { href: "/dashboard/caisse", label: "Caisse", roles: ["admin", "manager", "caissier"] },
  { href: "/dashboard/menu", label: "Menu", roles: ["admin", "manager"] },
  { href: "/dashboard/stock", label: "Stock", roles: ["admin", "manager", "stock"] },
  { href: "/dashboard/personnel", label: "Personnel", roles: ["admin", "manager"] },
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
