import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/guard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/dashboard/Card";
import {
  OpenSessionForm,
  CloseSessionForm,
  CashMovementForm,
  MovementsList,
} from "@/components/dashboard/CashSessionPanel";
import { formatXAF } from "@/lib/utils";

export const metadata = { title: "Caisse" };

export default async function CaissePage() {
  const employee = await requireRole("/dashboard/caisse");
  const supabase = createAdminClient();

  const { data: session } = await supabase
    .from("cash_sessions")
    .select("id, opened_at, opening_amount")
    .eq("cashier_id", employee.id)
    .eq("status", "ouverte")
    .maybeSingle();

  const { data: movements } = session
    ? await supabase
        .from("cash_movements")
        .select("id, type, amount, reason, created_at")
        .eq("cash_session_id", session.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const net = (movements ?? []).reduce((sum, m) => {
    if (m.type === "sortie") return sum - Number(m.amount);
    return sum + Number(m.amount);
  }, 0);
  const runningTotal = session ? Number(session.opening_amount) + net : 0;

  return (
    <div>
      <PageHeader title="Caisse" description="Ouverture, mouvements et clôture de votre session de caisse." />

      {!session ? (
        <Card className="max-w-md">
          <p className="mb-4 font-display text-lg text-champagne">Ouvrir une session</p>
          <OpenSessionForm />
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <p className="font-display text-lg text-champagne">Session en cours</p>
            <p className="mt-1 text-xs text-muted">
              Ouverte le{" "}
              {new Date(session.opened_at).toLocaleString("fr-FR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </p>
            <div className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Fonds initial</span>
                <span>{formatXAF(Number(session.opening_amount))}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-muted">Solde attendu</span>
                <span className="text-gold">{formatXAF(runningTotal)}</span>
              </div>
            </div>

            <div className="mt-8">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">
                Mouvements
              </p>
              <MovementsList movements={movements ?? []} />
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <p className="mb-4 font-display text-lg text-champagne">Ajouter un mouvement</p>
              <CashMovementForm sessionId={session.id} />
            </Card>
            <Card>
              <p className="mb-4 font-display text-lg text-champagne">Clôturer la session</p>
              <CloseSessionForm sessionId={session.id} />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
