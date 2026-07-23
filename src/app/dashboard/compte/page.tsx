import { requireEmployee } from "@/lib/auth/guard";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/dashboard/Card";
import { ChangePasswordForm } from "@/components/dashboard/ChangePasswordForm";
import { SetMyPinForm } from "@/components/dashboard/SetMyPinForm";
import { roleLabels } from "@/lib/dashboard-nav";

export const metadata = { title: "Mon compte" };

export default async function ComptePage() {
  const employee = await requireEmployee();

  const [supabase, admin] = [await createClient(), createAdminClient()];
  const [{ data: authSession }, { data: profile }] = await Promise.all([
    supabase.auth.getUser(),
    admin.from("employees").select("pin_hash").eq("id", employee.id).maybeSingle(),
  ]);
  const hasOfficeAccess = Boolean(authSession.user);
  const hasPin = Boolean(profile?.pin_hash);

  return (
    <div>
      <PageHeader title="Mon compte" description="Vos informations et la sécurité de votre compte." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <p className="mb-4 font-display text-lg text-champagne">Informations</p>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Nom</dt>
              <dd className="text-champagne">
                {employee.firstName} {employee.lastName}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">E-mail</dt>
              <dd className="text-champagne">{employee.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Rôle</dt>
              <dd className="text-champagne">{roleLabels[employee.role]}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <p className="mb-4 font-display text-lg text-champagne">Mon code PIN</p>
          <SetMyPinForm hasPin={hasPin} />
        </Card>

        {hasOfficeAccess ? (
          <Card>
            <p className="mb-4 font-display text-lg text-champagne">Changer mon mot de passe</p>
            <ChangePasswordForm />
          </Card>
        ) : null}
      </div>
    </div>
  );
}
