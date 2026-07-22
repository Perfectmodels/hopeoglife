import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseSecretKey } from "./env";

export function createAdminClient() {
  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      "Administration Supabase non configurée. Renseignez SUPABASE_SECRET_KEY dans .env.local"
    );
  }
  return createSupabaseClient(supabaseUrl, supabaseSecretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
