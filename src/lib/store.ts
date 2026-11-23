import { createClient } from "@supabase/supabase-js";
import { cacheLife } from "next/cache";
import { hasSupabaseCredentials } from "@/lib/catalog";
import type { StockEntry } from "@/lib/shop";

export interface StoreSettings {
  whatsapp: string;
  pagoMovil: { banco: string; telefono: string; documento: string };
  binance: { id: string; correo: string };
  transferencia: { banco: string; cuenta: string; titular: string; rif: string };
  themeKey: string;
  brandName: string;
  promptBot: string;
  source: "supabase" | "demo";
}

// Datos placeholder claros: reemplazar editando store_settings en Supabase.
export const DEMO_SETTINGS: StoreSettings = {
  whatsapp: "584120000000",
  pagoMovil: { banco: "Banco de ejemplo (0000)", telefono: "0412-0000000", documento: "V-00000000" },
  binance: { id: "000000000", correo: "pagos@soguau.com" },
  transferencia: {
    banco: "Banco de ejemplo",
    cuenta: "0000-0000-00-0000000000",
    titular: "So Guau C.A. (ejemplo)",
    rif: "J-00000000-0",
  },
  themeKey: "so-guau",
  brandName: "So Guau",
  promptBot: "",
  source: "demo",
};

type Row = Record<string, unknown>;
const s = (v: unknown, d: string) => (typeof v === "string" && v.trim() ? v.trim() : d);
const obj = (v: unknown): Row => (v && typeof v === "object" ? (v as Row) : {});

export async function getStoreSettings(): Promise<StoreSettings> {
  "use cache";
  cacheLife("minutes");
  if (!hasSupabaseCredentials()) return DEMO_SETTINGS;
  try {
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
    const { data, error } = await client.from("store_settings").select("*").limit(1).maybeSingle();
    if (error || !data) return DEMO_SETTINGS;
    const pm = obj(data.pago_movil);
    const bn = obj(data.binance);
    const tr = obj(data.transferencia);
    const d = DEMO_SETTINGS;
    return {
      whatsapp: s(data.whatsapp, d.whatsapp).replace(/\D/g, "") || d.whatsapp,
      pagoMovil: {
        banco: s(pm.banco, d.pagoMovil.banco),
        telefono: s(pm.telefono, d.pagoMovil.telefono),
        documento: s(pm.cedula ?? pm.ci_rif ?? pm.rif ?? pm.documento, d.pagoMovil.documento),
      },
      binance: { id: s(bn.id ?? bn.binance_id ?? bn.pay_id, d.binance.id), correo: s(bn.correo ?? bn.email, d.binance.correo) },
      transferencia: {
        banco: s(tr.banco, d.transferencia.banco),
        cuenta: s(tr.cuenta, d.transferencia.cuenta),
        titular: s(tr.titular, d.transferencia.titular),
        rif: s(tr.rif, d.transferencia.rif),
      },
      themeKey: s(data.theme_key, d.themeKey),
      brandName: s(data.brand_name ?? data.nombre_marca ?? data.name, d.brandName),
      promptBot: s(data.prompt_bot, ""),
      source: "supabase",
    };
  } catch {
    return DEMO_SETTINGS;
  }
}

const DEMO_STOCK: Record<string, StockEntry[]> = {
  franelas: [
    { color: "Carbón", size: "XXL", inStock: false },
    { color: "Verde bosque", size: "S", inStock: false },
  ],
  hoodies: [{ color: "Crema", size: "S", inStock: false }],
};

export async function getBlankStock(formatSlug: string): Promise<StockEntry[]> {
  "use cache";
  cacheLife("minutes");
  if (!hasSupabaseCredentials()) return DEMO_STOCK[formatSlug] ?? [];
  try {
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
    const { data, error } = await client
      .from("blank_stock")
      .select("color, talla, in_stock, product_formats!inner(slug)")
      .eq("product_formats.slug", formatSlug);
    if (error || !data) return [];
    return (data as Row[]).map((r) => ({
      color: String(r.color ?? ""),
      size: typeof r.talla === "string" ? r.talla : null,
      inStock: Boolean(r.in_stock),
    }));
  } catch {
    return [];
  }
}
