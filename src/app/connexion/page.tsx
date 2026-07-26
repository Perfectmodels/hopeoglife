import type { Metadata } from "next";
import Link from "next/link";
import { PinLoginForm } from "@/components/dashboard/PinLoginForm";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Espace personnel Hope Of Life.",
};

async function getStaffRoster() {
  if (!isSupabaseConfigured) return [];

  const admin = createAdminClient();
  const { data } = await admin
    .from("employees")
    .select("id, first_name, last_name")
    .eq("active", true)
    .not("pin_hash", "is", null)
    .order("first_name", { ascending: true });

  return (data ?? []).map((e) => ({
    id: e.id,
    firstName: e.first_name,
    lastName: e.last_name,
  }));
}

export default async function ConnexionPage() {
  const staff = await getStaffRoster();

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="font-display text-2xl font-semibold text-gradient-gold">
            {siteConfig.name}
          </p>
          <p className="mt-2 text-sm text-muted">Espace personnel</p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-background-elevated p-8">
          <PinLoginForm staff={staff} />
        </div>
        <p className="mt-6 text-center">
          <Link href="/admin/connexion" className="text-xs text-muted hover:text-gold">
            Connexion back-office (e-mail)
          </Link>
        </p>
      </div>
    </div>
  );
}
