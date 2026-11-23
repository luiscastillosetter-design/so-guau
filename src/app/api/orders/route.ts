import { NextResponse } from "next/server";
import { getBcvRate, formatBs } from "@/lib/bcv";
import { getCatalog } from "@/lib/catalog";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getStoreSettings } from "@/lib/store";
import { DELIVERY_METHODS, usd } from "@/lib/shop";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const PAYMENTS: Record<string, string> = { pago_movil: "Pago Móvil", binance: "Binance Pay", transferencia: "Transferencia Bancaria" };
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

interface IncomingItem {
  productId?: unknown;
  slug?: unknown;
  color?: unknown;
  size?: unknown;
  quantity?: unknown;
  isCustom?: unknown;
  customData?: { templateName?: unknown; petName?: unknown; previewUrl?: unknown; originalFileUrl?: unknown; position?: unknown; originalPaths?: unknown };
}

const txt = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

function newCode() {
  let c = "";
  for (let i = 0; i < 4; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return `SG-${c}`;
}

function hasServiceRole() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && key && /^https?:\/\//.test(url) && !/localhost|tu-proyecto|your-|xxxx/i.test(url) && key.length > 20 && !/your-|tu-|service-role-key/i.test(key));
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad("Solicitud inválida");
  }

  const nombre = txt(form.get("nombre"), 120);
  const whatsapp = txt(form.get("whatsapp"), 30).replace(/[^\d+]/g, "");
  const estadoCiudad = txt(form.get("estadoCiudad"), 120);
  const entregaId = txt(form.get("entrega"), 40);
  const direccion = txt(form.get("direccion"), 400);
  const metodoPago = txt(form.get("metodoPago"), 30);
  const referencia = txt(form.get("referencia"), 60);
  const file = form.get("comprobante");

  const entrega = DELIVERY_METHODS.find((d) => d.id === entregaId);
  if (nombre.length < 3) return bad("Escribe tu nombre completo");
  if (whatsapp.replace(/\D/g, "").length < 10) return bad("WhatsApp inválido");
  if (!estadoCiudad) return bad("Indica tu estado y ciudad");
  if (!entrega) return bad("Elige un método de entrega");
  if (entrega.id !== "retiro-guanare" && direccion.length < 4) return bad("Indica la dirección o agencia");
  if (!PAYMENTS[metodoPago]) return bad("Elige un método de pago");
  if (referencia.length < 4) return bad("Número de referencia obligatorio");
  if (!(file instanceof File) || file.size === 0) return bad("Adjunta la foto del comprobante");
  if (!TYPES[file.type]) return bad("El comprobante debe ser JPG, PNG o WebP");
  if (file.size > MAX_BYTES) return bad("El comprobante supera 5 MB");

  let incoming: IncomingItem[];
  try {
    const parsed = JSON.parse(String(form.get("items") ?? "[]"));
    incoming = Array.isArray(parsed) ? parsed : [];
  } catch {
    return bad("Carrito inválido");
  }
  if (!incoming.length || incoming.length > 50) return bad("Tu carrito está vacío");

  // Los precios se recalculan en el servidor a partir del catálogo.
  const { products } = await getCatalog();
  const items = [];
  let totalUsd = 0;
  for (const it of incoming) {
    const product = products.find((p) => p.id === it.productId || p.slug === it.slug);
    const quantity = Math.floor(Number(it.quantity));
    if (!product || !Number.isFinite(quantity) || quantity < 1 || quantity > 20) return bad("Hay un producto inválido en tu carrito");
    const isCustom = it.isCustom === true && product.customizable;
    items.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      priceUsd: product.priceUsd,
      color: txt(it.color, 40),
      size: txt(it.size, 20),
      quantity,
      isCustom,
      ...(isCustom && it.customData
        ? {
            customData: {
              templateName: txt(it.customData.templateName, 80),
              petName: txt(it.customData.petName, 60),
              previewUrl: /^(https?:\/\/|\/)/.test(txt(it.customData.previewUrl, 500)) ? txt(it.customData.previewUrl, 500) : "",
              originalFileUrl: txt(it.customData.originalFileUrl, 500),
              position: txt(it.customData.position, 30),
              originalPaths: Array.isArray(it.customData.originalPaths) ? it.customData.originalPaths.slice(0, 3).map((x) => txt(x, 300)) : [],
            },
          }
        : {}),
    });
    totalUsd += product.priceUsd * quantity;
  }
  totalUsd = Math.round(totalUsd * 100) / 100;

  const bcv = await getBcvRate();
  if (!bcv) return bad("No pudimos obtener la tasa BCV. Intenta de nuevo en unos minutos.", 503);
  const totalBs = Math.round(totalUsd * bcv.rate * 100) / 100;

  const settings = await getStoreSettings();
  const demoMode = !hasServiceRole();
  let orderCode = newCode();

  if (!demoMode) {
    try {
      const db = getSupabaseAdmin();
      const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${TYPES[file.type]}`;
      const up = await db.storage.from("comprobantes").upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
      if (up.error) {
        console.error("[orders] storage", up.error.message);
        return bad("No pudimos guardar tu comprobante. Intenta de nuevo.", 502);
      }

      let saved = false;
      for (let attempt = 0; attempt < 6 && !saved; attempt++) {
        const { error } = await db.from("orders").insert({
          codigo: orderCode,
          cliente_nombre: nombre,
          cliente_whatsapp: whatsapp,
          cliente_direccion: direccion || null,
          ciudad_estado: estadoCiudad,
          metodo_entrega: entrega.label,
          items_json: items,
          total_usd: totalUsd,
          tasa_bcv: bcv.rate,
          total_bs: totalBs,
          metodo_pago: PAYMENTS[metodoPago],
          referencia,
          comprobante_url: `comprobantes/${path}`,
          estado: "por_verificar",
        });
        if (!error) saved = true;
        else if (error.code === "23505") orderCode = newCode();
        else {
          console.error("[orders] insert", error.message);
          return bad("No pudimos registrar tu pedido. Intenta de nuevo.", 502);
        }
      }
      if (!saved) return bad("No pudimos registrar tu pedido. Intenta de nuevo.", 502);
    } catch (e) {
      console.error("[orders]", e instanceof Error ? e.message : e);
      return bad("Error del servidor al registrar el pedido", 500);
    }
  }

  const pagado = metodoPago === "binance" ? usd(totalUsd) : `Bs. ${formatBs(totalBs)}`;
  const lines = [
    `*Pedido ${orderCode} — So Guau* 🐾`,
    "",
    ...items.map((i) => `• ${i.quantity}x ${i.name} (${i.color}, ${i.size})${i.isCustom && i.customData?.petName ? ` — mascota: ${i.customData.petName}` : ""} — ${usd(i.priceUsd * i.quantity)}`),
    "",
    `Total: ${usd(totalUsd)} (≈ Bs. ${formatBs(totalBs)} a tasa BCV ${formatBs(bcv.rate)})`,
    `Pago: ${PAYMENTS[metodoPago]} — ${pagado}`,
    `Referencia: ${referencia}`,
    "",
    `Cliente: ${nombre}`,
    `WhatsApp: ${whatsapp}`,
    `Entrega: ${entrega.label} — ${estadoCiudad}${direccion ? ` — ${direccion}` : ""}`,
    "",
    "Ya subí mi comprobante. ¡Quedo atento a la confirmación!",
  ];
  const whatsappUrl = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;

  return NextResponse.json({ orderCode, whatsappUrl, totalUsd, totalBs, rate: bcv.rate, demo: demoMode });
}
