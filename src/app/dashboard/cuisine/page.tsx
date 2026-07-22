import { requireRole } from "@/lib/auth/guard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { KitchenBoard } from "@/components/dashboard/KitchenBoard";
import { getTickets } from "@/lib/queries/tickets";

export const metadata = { title: "Terminal cuisine" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CuisinePage() {
  await requireRole("/dashboard/cuisine");

  const tickets = await getTickets("cuisine");

  return (
    <div>
      <PageHeader title="Terminal cuisine" description="Commandes de plats à préparer, par ordre d'arrivée." />
      <KitchenBoard tickets={tickets} />
    </div>
  );
}
