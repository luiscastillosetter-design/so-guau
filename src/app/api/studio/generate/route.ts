import { NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { getSupabaseAdmin, hasServiceRole } from "@/lib/supabase/admin";
import { getStoreSettings } from "@/lib/store";
import { getTemplates } from "@/lib/studio";
import { FREE_TRIES, MAX_PHOTO_BYTES, WINDOW_MS } from "@/lib/studio-config";

export const maxDuration = 60;

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const BUCKET = "artes-personalizados";

const txt = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\r\n]+/g, " ").trim().slice(0, max) : "");
const fail = (error: string, status = 400, extra: Record<string, unknown> = {}) => NextResponse.json({ error, ...extra }, { status });

function normalizeWhatsapp(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = `58${d.slice(1)}`;
  else if (d.length === 10 && d.startsWith("4")) d = `58${d}`;
  return d;
}

function looksLikeImage(buf: Buffer, mime: string) {
  if (mime === "image/jpeg") return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (mime === "image/png") return buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG";
  return buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP";
}

// --- Antispam ---------------------------------------------------------------
interface LeadRow {
  id: string;
  whatsapp: string | null;
  ip_hash: string;
  generaciones_usadas: number;
  ultima_generacion_at: string | null;
}
const memory = new Map<string, { count: number; at: number }>();

function effective(count: number, at: number | null, now: number) {
  return at !== null && now - at < WINDOW_MS ? count : 0;
}

async function loadUsage(ipHash: string, wa: string, now: number) {
  let rows: LeadRow[] | null = null;
  if (hasServiceRole()) {
    const { data, error } = await getSupabaseAdmin()
      .from("ai_leads")
      .select("id, whatsapp, ip_hash, generaciones_usadas, ultima_generacion_at")
      .or(`ip_hash.eq.${ipHash},whatsapp.eq.${wa}`);
    if (error) console.error("[studio] ai_leads", error.message);
    else rows = data as LeadRow[];
  }
  if (rows) {
    const used = rows.reduce((m, r) => Math.max(m, effective(r.generaciones_usadas, r.ultima_generacion_at ? Date.parse(r.ultima_generacion_at) : null, now)), 0);
    return { used, rows };
  }
  const used = [`ip:${ipHash}`, `wa:${wa}`].reduce((m, k) => {
    const e = memory.get(k);
    return Math.max(m, e ? effective(e.count, e.at, now) : 0);
  }, 0);
  return { used, rows: null };
}

async function recordGeneration(ipHash: string, wa: string, name: string, used: number, rows: LeadRow[] | null, now: number) {
  const next = used + 1;
  if (rows && hasServiceRole()) {
    const db = getSupabaseAdmin();
    const patch = { nombre: name, whatsapp: wa, generaciones_usadas: next, ultima_generacion_at: new Date(now).toISOString() };
    if (rows.length) {
      await Promise.all(rows.map((r) => db.from("ai_leads").update(patch).eq("id", r.id)));
    } else {
      const { error } = await db.from("ai_leads").insert({ ...patch, ip_hash: ipHash });
      if (error) console.error("[studio] lead insert", error.message);
    }
    return next;
  }
  memory.set(`ip:${ipHash}`, { count: next, at: now });
  memory.set(`wa:${wa}`, { count: next, at: now });
  return next;
}

// --- Gemini (Nano Banana) ---------------------------------------------------
async function generateWithGemini(prompt: string, photos: { mime: string; b64: string }[]) {
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, ...photos.map((p) => ({ inline_data: { mime_type: p.mime, data: p.b64 } }))] }],
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
    }),
    signal: AbortSignal.timeout(55_000),
  });
  if (!res.ok) throw new Error(`gemini HTTP ${res.status}`);
  const json = (await res.json()) as { candidates?: { content?: { parts?: { inlineData?: { mimeType?: string; data?: string }; inline_data?: { mime_type?: string; data?: string } }[] } }[] };
  for (const part of json.candidates?.[0]?.content?.parts ?? []) {
    const data = part.inlineData?.data ?? part.inline_data?.data;
    const mime = part.inlineData?.mimeType ?? part.inline_data?.mime_type ?? "image/png";
    if (data) return { mime, b64: data };
  }
  throw new Error("gemini sin imagen");
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("Solicitud inválida");
  }

  const templates = await getTemplates();
  const template = templates.find((t) => t.slug === txt(form.get("templateSlug"), 60));
  const petName = txt(form.get("petName"), 40);
  const customText = txt(form.get("customText"), 60);
  const leadName = txt(form.get("leadName"), 80);
  const wa = normalizeWhatsapp(txt(form.get("leadWhatsapp"), 30));

  if (!template) return fail("Plantilla inválida");
  if (leadName.length < 2) return fail("Escribe tu nombre");
  if (wa.length < 11 || wa.length > 15) return fail("WhatsApp inválido");

  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return fail("Sube al menos una foto");
  if (files.length > template.maxPhotos) return fail(`Esta plantilla admite hasta ${template.maxPhotos} foto(s)`);

  const photos: { mime: string; b64: string; buf: Buffer; ext: string }[] = [];
  for (const f of files) {
    if (!EXT[f.type]) return fail("Solo se aceptan fotos JPG, PNG o WebP");
    if (f.size > MAX_PHOTO_BYTES) return fail("Cada foto debe pesar máximo 4 MB");
    const buf = Buffer.from(await f.arrayBuffer());
    if (!looksLikeImage(buf, f.type)) return fail("Una de las fotos no es una imagen válida");
    photos.push({ mime: f.type, b64: buf.toString("base64"), buf, ext: EXT[f.type] });
  }

  // Antispam: 2 generaciones gratis / 24 h por persona (WhatsApp) o IP.
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = fwd || req.headers.get("x-real-ip") || "unknown";
  const ipHash = createHash("sha256").update(ip).digest("hex");
  const now = Date.now();
  const usage = await loadUsage(ipHash, wa, now);
  if (usage.used >= FREE_TRIES) {
    const { whatsapp } = await getStoreSettings();
    const msg = encodeURIComponent(`Hola So Guau, soy ${leadName}. Ya usé mis pruebas gratis del estudio y quiero ayuda personalizada con mi diseño.`);
    return fail("¡Ya usaste tus 2 pruebas gratis de hoy! Escríbenos por WhatsApp y te ayudamos a crear tu diseño personalizado.", 429, {
      remainingTries: 0,
      whatsappUrl: `https://wa.me/${whatsapp}?text=${msg}`,
    });
  }

  // Generación
  const demoMode = !process.env.GEMINI_API_KEY;
  let art: { mime: string; b64: string };
  if (demoMode) {
    art = { mime: photos[0].mime, b64: photos[0].b64 };
  } else {
    const prompt = [
      template.promptSystem,
      petName ? `Pet name / phrase: "${petName}".` : "",
      customText ? `Custom text: "${customText}".` : "",
      "Identify the exact animal species in the photos (dog, cat, parrot, ferret, etc.) and adapt that exact pet to the style described.",
      "Output a single finished artwork centered on a plain pure white background, high resolution, ready to be printed with DTF. No garment, no mockup, no watermark.",
    ]
      .filter(Boolean)
      .join("\n");
    try {
      art = await generateWithGemini(prompt, photos);
    } catch (e) {
      console.error("[studio] gemini", e instanceof Error ? e.message : e);
      return fail("El motor de IA no respondió. No se descontó ninguna prueba; intenta de nuevo en un momento.", 502);
    }
  }

  // Almacenamiento privado
  let cleanStoragePath = "";
  const originalPaths: string[] = [];
  if (hasServiceRole()) {
    try {
      const db = getSupabaseAdmin();
      const id = randomUUID();
      const day = new Date(now).toISOString().slice(0, 10);
      for (const [i, p] of photos.entries()) {
        const path = `originales/${day}/${id}/foto-${i + 1}.${p.ext}`;
        const up = await db.storage.from(BUCKET).upload(path, p.buf, { contentType: p.mime, upsert: false });
        if (up.error) throw new Error(up.error.message);
        originalPaths.push(path);
      }
      const cleanPath = `limpios/${day}/${id}.${EXT[art.mime] ?? "png"}`;
      const up = await db.storage.from(BUCKET).upload(cleanPath, Buffer.from(art.b64, "base64"), { contentType: art.mime, upsert: false });
      if (up.error) throw new Error(up.error.message);
      cleanStoragePath = cleanPath;
    } catch (e) {
      console.error("[studio] storage", e instanceof Error ? e.message : e);
      return fail("No pudimos guardar tu diseño. No se descontó ninguna prueba; intenta de nuevo.", 502);
    }
  }

  const used = await recordGeneration(ipHash, wa, leadName, usage.used, usage.rows, now);
  return NextResponse.json({
    previewDataUrl: `data:${art.mime};base64,${art.b64}`,
    cleanStoragePath,
    originalPaths,
    remainingTries: Math.max(0, FREE_TRIES - used),
    demoMode,
  });
}
