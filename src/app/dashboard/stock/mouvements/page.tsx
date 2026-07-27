import { requireRole } from "@/lib/auth/guard";
import { getCurrentEmployee } from "@/lib/auth/session";
import { canAdministerStock } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, EmptyState } from "@/components/dashboard/Card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { CorrectMovementForm } from "@/components/dashboard/CorrectMovementForm";

export const metadata = { title: "Historique des mouvements" };

const TYPE_LABELS: Record<string, { label: string; tone: "success" | "warning" | "danger" | "info" }> = {
  entree: { label: "Entrée", tone: "success" },
  sortie: { label: "Sortie", tone: "info" },
  perte: { label: "Perte", tone: "danger" },
  ajustement: { label: "Ajustement", tone: "warning" },
  inventaire: { label: "Inventaire", tone: "info" },
};

export default async function MouvementsPage() {
  await requireRole("/dashboard/stock/mouvements");
  const employee = await getCurrentEmployee();
  const canCorrect = employee ? canAdministerStock(employee.role) : false;

  const supabase = createAdminClient();
  const { data: movements } = await supabase
    .from("stock_movements")
    .select(
      "id, type, quantity, quantity_before, quantity_after, reason, created_at, receipt_item_id, reversed_from_id, stock_items(name, unit), stock_locations(name), employees(first_name, last_name)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <PageHeader
        title="Historique des mouvements"
        description="Les 200 derniers mouvements de stock, du plus récent au plus ancien."
      />

      <Card>
        {movements && movements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table-responsive w-full text-left text-sm lg:min-w-[860px]">
              <thead className="text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Produit</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Quantité</th>
                  <th className="py-2 pr-4">Ancien → Nouveau</th>
                  <th className="py-2 pr-4">Emplacement</th>
                  <th className="py-2 pr-4">Employé</th>
                  {canCorrect ? <th className="py-2 pr-4">Correction</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {movements.map((m) => {
                  const item = m.stock_items as unknown as { name: string; unit: string } | null;
                  const location = m.stock_locations as unknown as { name: string } | null;
                  const creator = m.employees as unknown as { first_name: string; last_name: string } | null;
                  const type = TYPE_LABELS[m.type] ?? TYPE_LABELS.ajustement;
                  const canCorrectThisRow = canCorrect && m.type === "entree" && m.receipt_item_id && !m.reversed_from_id;

                  return (
                    <tr key={m.id}>
                      <td className="py-3 pr-4 text-muted" data-label="Date">
                        {new Date(m.created_at).toLocaleString("fr-FR")}
                      </td>
                      <td className="py-3 pr-4 text-champagne" data-label="Produit">{item?.name ?? "—"}</td>
                      <td className="py-3 pr-4" data-label="Type">
                        <StatusBadge label={type.label} tone={type.tone} />
                      </td>
                      <td className="py-3 pr-4 text-muted" data-label="Quantité">
                        {m.quantity > 0 ? "+" : ""}
                        {m.quantity} {item?.unit ?? ""}
                      </td>
                      <td className="py-3 pr-4 text-muted" data-label="Ancien → Nouveau">
                        {m.quantity_before !== null && m.quantity_after !== null
                          ? `${m.quantity_before} → ${m.quantity_after}`
                          : "—"}
                      </td>
                      <td className="py-3 pr-4 text-muted" data-label="Emplacement">{location?.name || "—"}</td>
                      <td className="py-3 pr-4 text-muted" data-label="Employé">
                        {creator ? `${creator.first_name} ${creator.last_name}` : "—"}
                      </td>
                      {canCorrect ? (
                        <td className="py-3 pr-4" data-label="Correction">
                          {canCorrectThisRow ? (
                            <CorrectMovementForm
                              receiptItemId={m.receipt_item_id as string}
                              currentQuantity={Number(m.quantity)}
                              unit={item?.unit ?? ""}
                            />
                          ) : null}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="Aucun mouvement enregistré." />
        )}
      </Card>
    </div>
  );
}
