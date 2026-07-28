import { Truck } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/guard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, EmptyState } from "@/components/dashboard/Card";
import { NewSupplierForm } from "@/components/dashboard/SupplierForm";

export const metadata = { title: "Fournisseurs" };

export default async function FournisseursPage() {
  await requireRole("/dashboard/fournisseurs");

  const supabase = createAdminClient();
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, name, contact_name, phone, email")
    .order("name", { ascending: true });

  return (
    <div>
      <PageHeader
        title="Fournisseurs"
        description="Gérez les fournisseurs utilisés lors des réceptions de stock."
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          {suppliers && suppliers.length > 0 ? (
            <div className="overflow-hidden">
              <table className="table-responsive w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="py-2 pr-4">Nom</th>
                    <th className="py-2 pr-4">Contact</th>
                    <th className="py-2 pr-4">Téléphone</th>
                    <th className="py-2 pr-4">E-mail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {suppliers.map((s) => (
                    <tr key={s.id}>
                      <td className="py-3 pr-4" data-label="Nom">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background-elevated text-muted">
                            <Truck size={14} />
                          </div>
                          <span className="text-champagne">{s.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-muted" data-label="Contact">{s.contact_name || "—"}</td>
                      <td className="py-3 pr-4 text-muted" data-label="Téléphone">{s.phone || "—"}</td>
                      <td className="py-3 pr-4 text-muted" data-label="E-mail">{s.email || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="Aucun fournisseur enregistré." />
          )}
        </Card>

        <Card>
          <p className="mb-4 font-display text-base text-champagne">Nouveau fournisseur</p>
          <NewSupplierForm />
        </Card>
      </div>
    </div>
  );
}
