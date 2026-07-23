import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { verifyPinSession } from "./pin-session";

export type EmployeeRole =
  | "admin"
  | "manager"
  | "caissier"
  | "serveur"
  | "cuisine"
  | "bar"
  | "stock";

export type CurrentEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  role: EmployeeRole;
  email: string | null;
};

function toEmployee(row: {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  email: string | null;
}): CurrentEmployee {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role as EmployeeRole,
    email: row.email,
  };
}

export async function getCurrentEmployee(): Promise<CurrentEmployee | null> {
  if (!isSupabaseConfigured) return null;

  // Session PIN (cookie maison) — pas de JWT Supabase Auth, donc lecture via le
  // client admin (RLS ne s'applique pas ici, il n'y a pas d'auth.uid()).
  const pinEmployeeId = await verifyPinSession();
  if (pinEmployeeId) {
    const admin = createAdminClient();
    const { data: employee } = await admin
      .from("employees")
      .select("id, first_name, last_name, role, email, active")
      .eq("id", pinEmployeeId)
      .maybeSingle();

    if (!employee || !employee.active) return null;
    return toEmployee(employee);
  }

  // Session classique Supabase Auth (back-office, e-mail + mot de passe).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: employee } = await supabase
    .from("employees")
    .select("id, first_name, last_name, role, email, active")
    .eq("id", user.id)
    .maybeSingle();

  if (!employee || !employee.active) return null;

  return toEmployee(employee);
}
