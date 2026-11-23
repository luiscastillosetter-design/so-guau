"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { Motif, ProductKind } from "@/lib/catalog";

export interface CustomData {
  templateName: string;
  petName: string;
  previewUrl: string;
  originalFileUrl: string;
  position?: string;
  originalPaths?: string[];
}

export interface CartItem {
  lineId: string;
  productId: string;
  slug: string;
  name: string;
  priceUsd: number;
  color: string;
  size: string;
  quantity: number;
  imageUrl: string;
  isCustom: boolean;
  customData?: CustomData;
  // Para dibujar la miniatura cuando no hay foto real
  colorHex?: string;
  kind?: ProductKind;
  motif?: Motif;
  printText?: string;
}

export type NewCartItem = Omit<CartItem, "lineId" | "quantity"> & { quantity?: number };

const KEY = "soguau-cart-v1";
const EMPTY: CartItem[] = [];
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedItems: CartItem[] = EMPTY;

function readItems(): CartItem[] {
  const raw = window.localStorage.getItem(KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const parsed = raw ? JSON.parse(raw) : [];
      cachedItems = Array.isArray(parsed) ? (parsed as CartItem[]) : EMPTY;
    } catch {
      cachedItems = EMPTY;
    }
  }
  return cachedItems;
}

function writeItems(items: CartItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* almacenamiento lleno o bloqueado */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

interface CartValue {
  items: CartItem[];
  count: number;
  subtotalUsd: number;
  rate: number | null;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: NewCartItem, opts?: { open?: boolean }) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, readItems, () => EMPTY);
  const [isOpen, setOpen] = useState(false);
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/bcv")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d?.rate) setRate(Number(d.rate));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const addItem = useCallback<CartValue["addItem"]>((item, opts) => {
    const qty = Math.max(1, item.quantity ?? 1);
    const current = readItems();
    const lineId = item.isCustom
      ? `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
      : `${item.productId}|${item.color}|${item.size}`;
    const existing = current.find((i) => i.lineId === lineId);
    const next = existing
      ? current.map((i) => (i.lineId === lineId ? { ...i, quantity: Math.min(20, i.quantity + qty) } : i))
      : [...current, { ...item, lineId, quantity: Math.min(20, qty) }];
    writeItems(next);
    if (opts?.open !== false) setOpen(true);
  }, []);

  const setQuantity = useCallback((lineId: string, quantity: number) => {
    const q = Math.min(20, Math.max(0, quantity));
    writeItems(readItems().flatMap((i) => (i.lineId !== lineId ? [i] : q === 0 ? [] : [{ ...i, quantity: q }])));
  }, []);

  const removeItem = useCallback((lineId: string) => writeItems(readItems().filter((i) => i.lineId !== lineId)), []);
  const clear = useCallback(() => writeItems([]), []);

  const value = useMemo<CartValue>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotalUsd: items.reduce((n, i) => n + i.priceUsd * i.quantity, 0),
      rate,
      isOpen,
      openCart: () => setOpen(true),
      closeCart: () => setOpen(false),
      addItem,
      setQuantity,
      removeItem,
      clear,
    }),
    [items, rate, isOpen, addItem, setQuantity, removeItem, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
