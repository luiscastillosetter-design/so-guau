import { NextResponse } from "next/server";
import { requireAdmin, isDemoPassword } from "@/lib/admin-auth";
import { ADMIN_DEMO_DATA } from "@/lib/admin-demo";
import { getSupabaseAdmin, hasServiceRole } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const meta = { demoPassword: isDemoPassword() };
  if (!hasServiceRole()) return NextResponse.json({ ...ADMIN_DEMO_DATA, meta: { ...meta, demoData: true } });

  try {
    const db = getSupabaseAdmin();
    const [settings, departments, formats, stock, products, slides, templates, orders, leads] = await Promise.all([
      db.from("store_settings").select("*").limit(1).maybeSingle(),
      db.from("departments").select("*").order("orden"),
      db.from("product_formats").select("*").order("orden"),
      db.from("blank_stock").select("*").order("color"),
      db.from("products").select("*").order("created_at", { ascending: false }),
      db.from("hero_slides").select("*").order("orden"),
      db.from("custom_templates").select("*").order("nombre"),
      db.from("orders").select("*").order("created_at", { ascending: false }).limit(300),
      db.from("ai_leads").select("*").order("ultima_generacion_at", { ascending: false, nullsFirst: false }).limit(300),
    ]);
    const firstError = [settings, departments, formats, stock, products, slides, templates, orders, leads].find((r) => r.error)?.error;
    if (firstError) {
      console.error("[admin/data]", firstError.message);
      return NextResponse.json({ error: "No se pudieron leer los datos. ¿Ejecutaste supabase/schema.sql?" }, { status: 502 });
    }
    return NextResponse.json({
      store_settings: settings.data,
      departments: departments.data,
      product_formats: formats.data,
      blank_stock: stock.data,
      products: products.data,
      hero_slides: slides.data,
      custom_templates: templates.data,
      orders: orders.data,
      ai_leads: leads.data,
      meta: { ...meta, demoData: false },
    });
  } catch (e) {
    console.error("[admin/data]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
