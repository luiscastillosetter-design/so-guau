import { NextResponse } from "next/server";
import { requireAdmin, isDemoPassword } from "@/lib/admin-auth";
import { ADMIN_DEMO_DATA } from "@/lib/admin-demo";
import { getSupabaseAdmin, hasServiceRole } from "@/lib/supabase/admin";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };
const FATAL = /invalid api key|fetch failed|jwt|invalid url|network|econn|enotfound|etimedout|unauthorized/i;

type Result = { data: unknown; error: { message: string; code?: string } | null };

export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const meta = { demoPassword: isDemoPassword() };
  if (!hasServiceRole()) {
    return NextResponse.json({ ...ADMIN_DEMO_DATA, meta: { ...meta, demoData: true } }, { headers: NO_STORE });
  }

  try {
    const db = getSupabaseAdmin();
    const queries: [string, PromiseLike<Result>][] = [
      ["store_settings", db.from("store_settings").select("*").limit(1).maybeSingle()],
      ["departments", db.from("departments").select("*").order("orden")],
      ["product_formats", db.from("product_formats").select("*").order("orden")],
      ["blank_stock", db.from("blank_stock").select("*").order("color")],
      ["products", db.from("products").select("*").order("created_at", { ascending: false })],
      ["hero_slides", db.from("hero_slides").select("*").order("orden")],
      ["custom_templates", db.from("custom_templates").select("*").order("nombre")],
      ["orders", db.from("orders").select("*").order("created_at", { ascending: false }).limit(300)],
      ["ai_leads", db.from("ai_leads").select("*").order("ultima_generacion_at", { ascending: false, nullsFirst: false }).limit(300)],
    ];
    const results = await Promise.all(queries.map(([, q]) => q));

    const warnings: string[] = [];
    let fatal = false;
    const out: Record<string, unknown> = {};
    results.forEach((r, i) => {
      const name = queries[i][0];
      if (r.error) {
        const msg = `Tabla ${name}: ${r.error.message} (código: ${r.error.code ?? "n/a"})`;
        warnings.push(msg);
        console.error("[admin/data]", msg);
        if (FATAL.test(r.error.message)) fatal = true;
        out[name] = name === "store_settings" ? null : [];
      } else {
        out[name] = r.data;
      }
    });

    if (warnings.length === queries.length || fatal) {
      return NextResponse.json({ error: warnings.join(" | "), warnings }, { status: 500, headers: NO_STORE });
    }
    return NextResponse.json({ ...out, warnings, meta: { ...meta, demoData: false } }, { headers: NO_STORE });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[admin/data]", message);
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE });
  }
}
