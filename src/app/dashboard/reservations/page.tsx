import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/Card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ReservationRow } from "@/components/dashboard/ReservationRow";
import { reservationStatuses, toOptions } from "@/lib/statuses";

export const metadata = { title: "Réservations" };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  await requireRole("/dashboard/reservations");

  const { date } = await searchParams;
  const selectedDate = date || todayISO();

  const supabase = await createClient();
  const [{ data: reservations }, { data: tables }] = await Promise.all([
    supabase
      .from("reservations")
      .select(
        "id, first_name, last_name, phone, email, party_size, reservation_time, occasion, special_requests, status, table_id"
      )
      .eq("reservation_date", selectedDate)
      .order("reservation_time", { ascending: true }),
    supabase
      .from("dining_tables")
      .select("id, label, dining_areas ( name )")
      .order("label", { ascending: true }),
  ]);

  const statusOptions = toOptions(reservationStatuses);
  const tableOptions = (tables ?? []).map((t) => ({
    id: t.id,
    label: `${t.label}${t.dining_areas ? ` — ${(t.dining_areas as unknown as { name: string }).name}` : ""}`,
  }));

  return (
    <div>
      <PageHeader
        title="Réservations"
        description="Gérez les réservations de tables et leur statut."
        action={
          <form className="flex items-center gap-2">
            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              className="rounded-lg border border-border-subtle bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
            />
            <button
              type="submit"
              className="rounded-lg border border-gold/50 px-4 py-2 text-sm text-gold hover:bg-gold/10"
            >
              Filtrer
            </button>
          </form>
        }
      />

      {reservations && reservations.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-border-subtle">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-background-elevated text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3">Heure</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Pers.</th>
                <th className="px-4 py-3">Occasion</th>
                <th className="px-4 py-3">Table</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {reservations.map((r) => (
                <ReservationRow
                  key={r.id}
                  reservation={r}
                  statusOptions={statusOptions}
                  tableOptions={tableOptions}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="Aucune réservation pour cette date." />
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {Object.entries(reservationStatuses).map(([key, { label, tone }]) => (
          <StatusBadge key={key} label={label} tone={tone} />
        ))}
      </div>
    </div>
  );
}
