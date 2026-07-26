import { redirect } from "next/navigation";
import { requireEmployee } from "@/lib/auth/guard";
import { OwnerOverview } from "@/components/dashboard/OwnerOverview";
import { ServerOverview } from "@/components/dashboard/ServerOverview";

const PRIMARY_TOOL: Partial<Record<string, string>> = {
  cuisine: "/dashboard/cuisine",
  bar: "/dashboard/bar",
  caissier: "/dashboard/caisse",
  stock: "/dashboard/stock",
};

export default async function DashboardHomePage() {
  const employee = await requireEmployee();

  if (employee.role === "admin" || employee.role === "manager") {
    return <OwnerOverview />;
  }

  if (employee.role === "serveur") {
    return <ServerOverview employee={employee} />;
  }

  redirect(PRIMARY_TOOL[employee.role] ?? "/dashboard/compte");
}
