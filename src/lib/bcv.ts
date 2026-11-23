export interface BcvRate {
  rate: number;
  source: string;
  updatedAt: string;
}

const TTL_MS = 15 * 60 * 1000;
const TIMEOUT_MS = 2500;
let cache: { value: BcvRate; at: number } | null = null;

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function num(v: unknown): number | null {
  const n = typeof v === "string" ? parseFloat(v.replace(",", ".")) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function fromPrimary(): Promise<BcvRate> {
  const d = (await fetchJson("https://pydolarve.org/api/v1/dollar?page=bcv&monitor=usd")) as Record<string, unknown>;
  const rate = num(d?.price) ?? num((d?.monitors as Record<string, { price?: unknown }> | undefined)?.usd?.price);
  if (!rate) throw new Error("invalid primary");
  return { rate, source: "pydolarve-bcv", updatedAt: new Date().toISOString() };
}

async function fromBackup(): Promise<BcvRate> {
  const d = (await fetchJson("https://ve.dolarapi.com/v1/dolares/oficial")) as Record<string, unknown>;
  const rate = num(d?.promedio) ?? num(d?.venta);
  if (!rate) throw new Error("invalid backup");
  return { rate, source: "dolarapi-oficial", updatedAt: String(d?.fechaActualizacion ?? new Date().toISOString()) };
}

export async function getBcvRate(): Promise<BcvRate | null> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  for (const source of [fromPrimary, fromBackup]) {
    try {
      const value = await source();
      cache = { value, at: Date.now() };
      return value;
    } catch {
      /* intentar siguiente fuente */
    }
  }
  return cache?.value ?? null;
}

export function formatBs(n: number): string {
  return new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}
