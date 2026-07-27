import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/guard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, EmptyState } from "@/components/dashboard/Card";
import { EmployeeRow } from "@/components/dashboard/EmployeeRow";
import { NewEmployeeForm } from "@/components/dashboard/NewEmployeeForm";

export const metadata = { title: "Personnel" };

export default async function PersonnelPage() {
  await requireRole("/dashboard/personnel");

  const supabase = createAdminClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("id, first_name, last_name, phone, email, role, active")
    .order("first_name", { ascending: true });

  return (
    <div>
      <PageHeader title="Personnel" description="Gérez les membres de l'équipe et leurs rôles." />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          {employees && employees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table-responsive w-full text-left text-sm lg:min-w-[640px]">
                <thead className="text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-2">Nom</th>
                    <th className="px-4 py-2">Contact</th>
                    <th className="px-4 py-2">Rôle</th>
                    <th className="px-4 py-2">Statut</th>
                    <th className="px-4 py-2">PIN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {employees.map((e) => (
                    <EmployeeRow key={e.id} employee={e} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="Aucun membre du personnel enregistré." />
          )}
        </Card>

        <Card>
          <p className="mb-4 font-display text-base text-champagne">Ajouter un membre</p>
          <NewEmployeeForm />
        </Card>
      </div>
    </div>
  );
}
