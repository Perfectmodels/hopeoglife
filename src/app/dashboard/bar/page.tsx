import { requireRole } from "@/lib/auth/guard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { KitchenBoard } from "@/components/dashboard/KitchenBoard";
import { getTickets } from "@/lib/queries/tickets";

export const metadata = { title: "Terminal bar" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BarPage() {
  await requireRole("/dashboard/bar");

  const tickets = await getTickets("bar");

  return (
    <div>
      <PageHeader title="Terminal bar" description="Boissons et cocktails à préparer, par ordre d'arrivée." />
      <KitchenBoard tickets={tickets} />
    </div>
  );
}
