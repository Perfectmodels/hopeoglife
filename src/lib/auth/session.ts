import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

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

export async function getCurrentEmployee(): Promise<CurrentEmployee | null> {
  if (!isSupabaseConfigured) return null;

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

  return {
    id: employee.id,
    firstName: employee.first_name,
    lastName: employee.last_name,
    role: employee.role as EmployeeRole,
    email: employee.email,
  };
}
