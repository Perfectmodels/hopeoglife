import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/Card";
import { TableCard } from "@/components/dashboard/TableCard";

export const metadata = { title: "Plan de salle" };

export default async function SallePage() {
  await requireRole("/dashboard/salle");

  const supabase = await createClient();
  const { data: areas } = await supabase
    .from("dining_areas")
    .select("id, name, is_vip, dining_tables ( id, label, capacity, status )")
    .order("sort_order", { ascending: true });

  const hasTables = areas?.some((a) => (a.dining_tables?.length ?? 0) > 0);

  return (
    <div>
      <PageHeader
        title="Plan de salle"
        description="Visualisez et mettez à jour l'état des tables en temps réel."
      />

      {!areas || areas.length === 0 || !hasTables ? (
        <EmptyState message="Aucune table configurée. Ajoutez des espaces et des tables depuis Supabase pour commencer." />
      ) : (
        <div className="space-y-10">
          {areas.map((area) => (
            <div key={area.id}>
              <h2 className="mb-4 font-display text-lg text-gold-soft">
                {area.name}
                {area.is_vip ? (
                  <span className="ml-2 rounded-full border border-gold/40 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold">
                    VIP
                  </span>
                ) : null}
              </h2>
              {area.dining_tables && area.dining_tables.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {area.dining_tables.map((t) => (
                    <TableCard key={t.id} table={t} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">Aucune table dans cet espace.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
