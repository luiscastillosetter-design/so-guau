import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin, hasServiceRole } from "@/lib/supabase/admin";

const BUCKETS = ["comprobantes", "artes-personalizados"];
const EXPIRES_SECONDS = 300;

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  let body: { bucket?: unknown; path?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("Solicitud inválida");
  }
  const bucket = String(body.bucket ?? "");
  let path = String(body.path ?? "").trim();
  if (!BUCKETS.includes(bucket)) return fail("Bucket no permitido", 403);
  // Los pedidos guardan "comprobantes/<ruta>": se quita el prefijo del bucket.
  if (path.startsWith(`${bucket}/`)) path = path.slice(bucket.length + 1);
  if (!path || path.includes("..") || path.startsWith("/") || path.length > 400) return fail("Ruta inválida");
  if (!hasServiceRole()) return fail("Modo demo: no hay archivos privados sin Supabase.", 503);

  try {
    const { data, error } = await getSupabaseAdmin().storage.from(bucket).createSignedUrl(path, EXPIRES_SECONDS);
    if (error || !data?.signedUrl) return fail("No se encontró el archivo", 404);
    return NextResponse.json({ url: data.signedUrl, expiresIn: EXPIRES_SECONDS });
  } catch (e) {
    console.error("[admin/signed-url]", e instanceof Error ? e.message : e);
    return fail("Error del servidor", 500);
  }
}
