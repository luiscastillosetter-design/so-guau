import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin, hasServiceRole } from "@/lib/supabase/admin";

const TABLES = ["store_settings", "departments", "product_formats", "blank_stock", "products", "hero_slides", "custom_templates", "orders"] as const;
const ORDER_STATES = ["por_verificar", "confirmado", "en_taller", "enviado"];
const RESERVED = ["created_at"];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function revalidateStore() {
  revalidatePath("/", "layout");
  revalidatePath("/tienda");
  revalidatePath("/estudio");
  revalidatePath("/contacto");
}

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  let body: { table?: unknown; action?: unknown; id?: unknown; values?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("Solicitud inválida");
  }

  const table = String(body.table ?? "") as (typeof TABLES)[number];
  const action = String(body.action ?? "");
  if (!TABLES.includes(table)) return fail("Tabla no permitida", 403);
  if (!["upsert", "update", "delete"].includes(action)) return fail("Acción inválida");
  if (!hasServiceRole()) return fail("Modo demo: conecta Supabase (SUPABASE_SERVICE_ROLE_KEY) para guardar cambios.", 503);

  const values: Record<string, unknown> = {};
  if (body.values && typeof body.values === "object" && !Array.isArray(body.values)) {
    for (const [k, v] of Object.entries(body.values as Record<string, unknown>)) {
      if (/^[a-z_]+$/.test(k) && !RESERVED.includes(k)) values[k] = v;
    }
  }
  const id = typeof body.id === "string" ? body.id : typeof values.id === "string" ? values.id : "";

  // Los pedidos solo cambian de estado desde el panel (nunca se crean ni se borran aquí).
  if (table === "orders") {
    if (action !== "update") return fail("Los pedidos solo admiten cambio de estado", 403);
    if (!ORDER_STATES.includes(String(values.estado))) return fail("Estado inválido");
    values.estado = String(values.estado);
    for (const k of Object.keys(values)) if (k !== "estado") delete values[k];
  }

  try {
    const db = getSupabaseAdmin();
    if (action === "delete") {
      if (!uuid.test(id)) return fail("ID inválido");
      const { error } = await db.from(table).delete().eq("id", id);
      if (error) return fail(error.message, 400);
      revalidateStore();
      return NextResponse.json({ ok: true });
    }
    if (action === "update") {
      if (!uuid.test(id)) return fail("ID inválido");
      delete values.id;
      const { data, error } = await db.from(table).update(values).eq("id", id).select().maybeSingle();
      if (error) return fail(error.message, 400);
      revalidateStore();
      return NextResponse.json({ ok: true, row: data });
    }
    // upsert: sin id válido se crea una fila nueva
    if (!uuid.test(String(values.id ?? ""))) delete values.id;
    const { data, error } = await db.from(table).upsert(values).select().maybeSingle();
    if (error) return fail(error.message, 400);
    revalidateStore();
    return NextResponse.json({ ok: true, row: data });
  } catch (e) {
    console.error("[admin/crud]", e instanceof Error ? e.message : e);
    return fail("Error del servidor", 500);
  }
}
