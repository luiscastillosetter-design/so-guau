// Utilidades puras (seguras para cliente y servidor).
import type { ProductKind } from "@/lib/catalog";

export const CLOTHING_SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export const SINGLE_SIZE = "Única";

export function sizesFor(kind: ProductKind): string[] {
  return kind === "tee" || kind === "hoodie" ? [...CLOTHING_SIZES] : [SINGLE_SIZE];
}

export interface StockEntry {
  color: string;
  size: string | null;
  inStock: boolean;
}

const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();

/** Una combinación está agotada solo si existe registro en blank_stock y ninguno está disponible. */
export function isAvailable(stock: StockEntry[], color: string, size: string): boolean {
  const matches = stock.filter(
    (e) => norm(e.color) === norm(color) && (e.size === null || norm(e.size) === "" || norm(e.size) === norm(size)),
  );
  if (!matches.length) return true;
  return matches.some((e) => e.inStock);
}

export const SIZE_GUIDE: { size: string; chest: string; length: string; sleeve: string }[] = [
  { size: "S", chest: "50", length: "68", sleeve: "20" },
  { size: "M", chest: "53", length: "70", sleeve: "21" },
  { size: "L", chest: "56", length: "73", sleeve: "22" },
  { size: "XL", chest: "59", length: "76", sleeve: "23" },
  { size: "XXL", chest: "62", length: "79", sleeve: "24" },
];

export const DELIVERY_METHODS = [
  { id: "delivery-caracas", label: "Delivery Caracas", field: "Dirección de entrega" },
  { id: "retiro-guanare", label: "Retiro en Guanare", field: "Persona que retira (opcional)" },
  { id: "mrw", label: "Envío Nacional MRW", field: "Agencia MRW de destino" },
  { id: "zoom", label: "Zoom", field: "Agencia Zoom de destino" },
  { id: "tealca", label: "Tealca", field: "Agencia Tealca de destino" },
] as const;

export type PaymentMethodId = "pago_movil" | "binance" | "transferencia";

export const usd = (n: number) => `$${n.toFixed(2)}`;
