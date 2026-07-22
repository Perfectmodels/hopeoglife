import { redirect } from "next/navigation";
import { getCurrentEmployee, type CurrentEmployee } from "./session";
import { dashboardNav } from "@/lib/dashboard-nav";

export async function requireEmployee(): Promise<CurrentEmployee> {
  const employee = await getCurrentEmployee();
  if (!employee) {
    redirect("/connexion");
  }
  return employee;
}

export async function requireRole(href: string): Promise<CurrentEmployee> {
  const employee = await requireEmployee();
  const item = dashboardNav.find((i) => i.href === href);

  if (item && !item.roles.includes(employee.role)) {
    redirect("/dashboard/acces-refuse");
  }

  return employee;
}
