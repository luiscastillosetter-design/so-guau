import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin, hasServiceRole } from "@/lib/supabase/admin";

const TYPES: Record<string, { ext: string; max: number }> = {
  "image/jpeg": { ext: "jpg", max: 8 * 1024 * 1024 },
  "image/png": { ext: "png", max: 8 * 1024 * 1024 },
  "image/webp": { ext: "webp", max: 8 * 1024 * 1024 },
  "image/gif": { ext: "gif", max: 8 * 1024 * 1024 },
  "video/mp4": { ext: "mp4", max: 50 * 1024 * 1024 },
  "video/webm": { ext: "webm", max: 50 * 1024 * 1024 },
};
const FOLDERS = ["logo", "productos", "hero", "plantillas"];

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

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("Solicitud inválida");
  }
  const file = form.get("file");
  const folderRaw = String(form.get("folder") ?? "productos");
  const folder = FOLDERS.includes(folderRaw) ? folderRaw : "productos";
  if (!(file instanceof File) || file.size === 0) return fail("Adjunta un archivo");
  const rule = TYPES[file.type];
  if (!rule) return fail("Formato no permitido (JPG, PNG, WebP, GIF, MP4 o WebM)");
  if (file.size > rule.max) return fail(`El archivo supera ${Math.round(rule.max / 1024 / 1024)} MB`);
  if (!hasServiceRole()) return fail("Modo demo: conecta Supabase para subir archivos.", 503);

  try {
    const db = getSupabaseAdmin();
    const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${rule.ext}`;
    const { error } = await db.storage.from("media").upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) {
      console.error("[admin/upload]", error.message);
      return fail("No se pudo subir. ¿Existe el bucket público 'media'? (ejecuta schema.sql)", 502);
    }
    const { data } = db.storage.from("media").getPublicUrl(path);
    revalidateStore();
    return NextResponse.json({ url: data.publicUrl });
  } catch (e) {
    console.error("[admin/upload]", e instanceof Error ? e.message : e);
    return fail("Error del servidor", 500);
  }
}
