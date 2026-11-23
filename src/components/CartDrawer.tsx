"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart, type CartItem } from "@/context/CartContext";
import { Mockup } from "@/components/ProductArt";
import { formatBs } from "@/lib/bcv";
import { usd } from "@/lib/shop";

const MQ = "(min-width: 768px)";
function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(MQ);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(MQ).matches,
    () => true,
  );
}

export function CartThumb({ item, className = "" }: { item: CartItem; className?: string }) {
  return (
    <div className={`grid place-items-center overflow-hidden rounded-xl bg-[#F1ECDB] p-2 ${className}`}>
      {item.imageUrl ? (
        <div role="img" aria-label={item.name} className="h-full w-full bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${item.imageUrl})` }} />
      ) : item.kind ? (
        <Mockup kind={item.kind} motif={item.motif ?? "paw"} printText={item.printText ?? "SO GUAU"} color={item.colorHex ?? "#FFFFFF"} view="front" />
      ) : (
        <ShoppingBag className="h-6 w-6 text-brand-primary/40" />
      )}
    </div>
  );
}

export default function CartDrawer() {
  const { items, isOpen, closeCart, setQuantity, removeItem, subtotalUsd, rate, count } = useCart();
  const desktop = useIsDesktop();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, closeCart]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="overlay"
            className="fixed inset-0 z-[60] bg-brand-text/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />
          <motion.aside
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label="Carrito de compras"
            className="fixed inset-x-0 bottom-0 z-[61] flex max-h-[90dvh] flex-col rounded-t-3xl bg-brand-bg shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[460px] md:rounded-none"
            initial={desktop ? { x: "100%" } : { y: "100%" }}
            animate={desktop ? { x: 0 } : { y: 0 }}
            exit={desktop ? { x: "100%" } : { y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
          >
            <header className="flex items-center justify-between border-b border-brand-primary/10 px-5 py-4 md:px-7 md:py-5">
              <div>
                <h2 className="font-display text-2xl font-semibold text-brand-primary">Tu carrito</h2>
                <p className="font-ui text-xs text-brand-text/60">{count} {count === 1 ? "artículo" : "artículos"}</p>
              </div>
              <button type="button" onClick={closeCart} aria-label="Cerrar carrito" className="grid h-11 w-11 place-items-center rounded-full text-brand-primary transition-colors hover:bg-brand-primary/10">
                <X className="h-5 w-5" />
              </button>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-16 text-center">
                <ShoppingBag className="h-12 w-12 text-brand-primary/30" />
                <p className="font-display text-xl text-brand-primary">Tu carrito está vacío</p>
                <Link href="/tienda" onClick={closeCart} className="rounded-full bg-brand-primary px-7 py-3.5 font-ui text-xs font-semibold uppercase tracking-[0.16em] text-brand-on-primary">
                  Ver la tienda
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-brand-primary/10 overflow-y-auto px-5 md:px-7">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.li
                        key={item.lineId}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex gap-4 py-5">
                          <CartThumb item={item} className="h-24 w-20 shrink-0" />
                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-display text-base leading-tight text-brand-primary">{item.name}</p>
                              <button type="button" onClick={() => removeItem(item.lineId)} aria-label={`Eliminar ${item.name}`} className="-mr-2 -mt-2 grid h-10 w-10 shrink-0 place-items-center rounded-full text-brand-text/50 transition-colors hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="font-ui text-xs text-brand-text/60">
                              {item.color} · {item.size}
                              {item.isCustom && item.customData ? ` · ${item.customData.petName}` : ""}
                            </p>
                            <div className="mt-auto flex items-center justify-between pt-3">
                              <div className="flex items-center rounded-full border border-brand-primary/20">
                                <button type="button" onClick={() => setQuantity(item.lineId, item.quantity - 1)} aria-label="Restar uno" className="grid h-11 w-11 place-items-center text-brand-primary">
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="w-6 text-center font-ui text-sm font-semibold">{item.quantity}</span>
                                <button type="button" onClick={() => setQuantity(item.lineId, item.quantity + 1)} aria-label="Sumar uno" className="grid h-11 w-11 place-items-center text-brand-primary">
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="text-right">
                                <p className="font-ui text-sm font-bold text-brand-primary">{usd(item.priceUsd * item.quantity)}</p>
                                {rate && <p className="font-ui text-[11px] text-brand-text/55">Bs. {formatBs(item.priceUsd * item.quantity * rate)}</p>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                <footer className="border-t border-brand-primary/10 bg-brand-bg px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 md:px-7">
                  <div className="flex items-end justify-between">
                    <span className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-brand-text/60">Subtotal</span>
                    <div className="text-right">
                      <p className="font-ui text-2xl font-bold text-brand-primary">{usd(subtotalUsd)}</p>
                      <p className="font-ui text-xs text-brand-text/60">{rate ? `≈ Bs. ${formatBs(subtotalUsd * rate)} (BCV)` : "≈ Bs. --,--"}</p>
                    </div>
                  </div>
                  <Link href="/checkout" onClick={closeCart} className="mt-4 flex h-14 items-center justify-center rounded-full bg-brand-primary font-ui text-sm font-semibold uppercase tracking-[0.16em] text-brand-on-primary shadow-[0_10px_24px_-12px_rgba(30,77,36,0.8)] transition-transform hover:-translate-y-0.5">
                    Ir a pagar
                  </Link>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
