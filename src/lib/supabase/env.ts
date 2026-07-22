export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Clé secrète (service role) — usage serveur uniquement, jamais exposée au client.
export const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

/**
 * Tant que le projet Supabase n'est pas connecté, l'app tourne en "mode démo"
 * avec des données statiques — utile pour visualiser le design sans backend.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
