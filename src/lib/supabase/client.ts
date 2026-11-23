import { createClient } from "@supabase/supabase-js";

const clean = (v?: string) => (v ?? "").trim().replace(/^["']|["']$/g, "");

export const supabase = createClient(
  clean(process.env.NEXT_PUBLIC_SUPABASE_URL) || "http://localhost:54321",
  clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || "anon-key-missing",
);
