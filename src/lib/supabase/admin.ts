import { createClient } from "@supabase/supabase-js";

// Solo servidor: nunca importar desde componentes cliente.
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan variables de Supabase en el servidor");
  return createClient(url, key, { auth: { persistSession: false } });
}

export function hasServiceRole() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && key && /^https?:\/\//.test(url) && !/localhost|tu-proyecto|your-|xxxx/i.test(url) && key.length > 20 && !/your-|tu-|service-role-key/i.test(key));
}
