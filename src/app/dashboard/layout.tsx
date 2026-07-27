import { redirect } from "next/navigation";
import { getCurrentEmployee } from "@/lib/auth/session";
import { navForRole } from "@/lib/dashboard-nav";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const employee = await getCurrentEmployee();

  if (!employee) {
    redirect("/connexion");
  }

  const items = navForRole(employee.role);

  return (
    <div className="dashboard-shell flex min-h-screen">
      <Sidebar items={items} />
      <div className="min-w-0 flex flex-1 flex-col">
        <Topbar
          items={items}
          employeeName={`${employee.firstName} ${employee.lastName}`}
          role={employee.role}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-7 xl:p-8">{children}</main>
      </div>
    </div>
  );
}
