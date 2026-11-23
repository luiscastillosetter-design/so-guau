"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Minus, Plus, Sparkles } from "lucide-react";
import type { Product, ProductView } from "@/lib/catalog";
import ProductArt from "@/components/ProductArt";
import ProductCard from "@/components/ProductCard";
import Price from "@/components/Price";
import { useCart } from "@/context/CartContext";
import { SIZE_GUIDE, SINGLE_SIZE, isAvailable, sizesFor, usd, type StockEntry } from "@/lib/shop";

const VIEWS: { id: ProductView; label: string }[] = [
  { id: "front", label: "Frente" },
  { id: "back", label: "Espalda" },
  { id: "profile", label: "Perfil" },
];

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-brand-primary/15">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-h-14 w-full items-center justify-between py-4 text-left font-ui text-xs font-semibold uppercase tracking-[0.18em] text-brand-primary">
        {title}
        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="pb-5 font-ui text-sm leading-relaxed text-brand-text/80">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductDetail({ product, stock, related }: { product: Product; stock: StockEntry[]; related: Product[] }) {
  const { addItem } = useCart();
  const [view, setView] = useState<ProductView>("front");
  const [colorIdx, setColorIdx] = useState(0);
  const [pickedSize, setPickedSize] = useState("");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const sizeRef = useRef<HTMLDivElement>(null);

  const color = product.colors[colorIdx] ?? product.colors[0];
  const sizes = sizesFor(product.kind);
  const single = sizes.length === 1;
  const size = single ? SINGLE_SIZE : isAvailable(stock, color.name, pickedSize) ? pickedSize : "";
  const colorSoldOut = sizes.every((s) => !isAvailable(stock, color.name, s));
  const apparel = !single;

  function handleAdd() {
    if (!size) {
      setError(colorSoldOut ? "Este color está agotado. Prueba con otro." : "Elige tu talla para continuar.");
      sizeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setError("");
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      priceUsd: product.priceUsd,
      color: color.name,
      colorHex: color.hex,
      size,
      quantity: qty,
      imageUrl: product.images.front ?? "",
      isCustom: false,
      kind: product.kind,
      motif: product.motif,
      printText: product.printText,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <>
      <div className="container-wide grid gap-8 py-6 md:py-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
        {/* Visor */}
        <div className="lg:sticky lg:top-36 lg:self-start">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-brand-primary/10 bg-[#F8F5EA] shadow-[inset_0_0_80px_rgba(30,77,36,0.04)] md:aspect-[5/4] lg:aspect-[4/4.2]">
            <AnimatePresence mode="wait">
              <motion.div key={`${view}-${color.name}`} className="absolute inset-0 p-8 md:p-14" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
                <ProductArt product={product} color={color.hex} view={view} />
              </motion.div>
            </AnimatePresence>
            {product.badge && <span className="absolute left-4 top-4 rounded-full bg-brand-primary px-3.5 py-1.5 font-ui text-[10px] font-bold uppercase tracking-[0.14em] text-brand-on-primary">{product.badge}</span>}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 md:gap-3" role="tablist" aria-label="Vista del producto">
            {VIEWS.map((v) => (
              <button key={v.id} type="button" role="tab" aria-selected={view === v.id} onClick={() => setView(v.id)} className={`h-12 rounded-full border font-ui text-xs font-semibold uppercase tracking-[0.16em] transition-all ${view === v.id ? "border-brand-primary bg-brand-primary text-brand-on-primary" : "border-brand-primary/20 text-brand-primary hover:border-brand-primary/60"}`}>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Compra */}
        <div className="flex flex-col">
          <nav className="mb-4 font-ui text-xs text-brand-text/55" aria-label="Migas de pan">
            <Link href="/tienda" className="hover:text-brand-primary">Tienda</Link> / <span>{product.name}</span>
          </nav>
          <h1 className="font-display text-4xl font-semibold leading-tight text-brand-primary md:text-5xl">{product.name}</h1>
          <Price usdValue={product.priceUsd} compareAtUsd={product.compareAtUsd} size="lg" className="mt-5" />

          <div className="mt-8">
            <p className="font-ui text-xs font-semibold uppercase tracking-[0.18em] text-brand-text/70">
              Color: <span className="text-brand-primary">{color.name}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
              {product.colors.map((c, i) => (
                <button key={c.name} type="button" role="radio" aria-checked={i === colorIdx} aria-label={c.name} title={c.name} onClick={() => setColorIdx(i)} className={`grid h-12 w-12 place-items-center rounded-full transition-transform hover:scale-105 ${i === colorIdx ? "ring-2 ring-brand-primary ring-offset-2 ring-offset-brand-bg" : ""}`}>
                  <span className="h-9 w-9 rounded-full border border-black/15" style={{ backgroundColor: c.hex }} />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-7" ref={sizeRef}>
            <p className="font-ui text-xs font-semibold uppercase tracking-[0.18em] text-brand-text/70">
              Talla: <span className="text-brand-primary">{size || (single ? SINGLE_SIZE : "Elige una")}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Talla">
              {sizes.map((s) => {
                const ok = isAvailable(stock, color.name, s);
                const active = size === s;
                return (
                  <button key={s} type="button" role="radio" aria-checked={active} disabled={!ok} onClick={() => { setPickedSize(s); setError(""); }} className={`h-12 min-w-14 rounded-full border px-5 font-ui text-sm font-semibold transition-all ${active ? "border-brand-primary bg-brand-primary text-brand-on-primary" : ok ? "border-brand-primary/25 text-brand-primary hover:border-brand-primary" : "cursor-not-allowed border-brand-primary/10 text-brand-text/30 line-through"}`}>
                    {s}
                  </button>
                );
              })}
            </div>
            {apparel && sizes.some((s) => !isAvailable(stock, color.name, s)) && <p className="mt-2 font-ui text-xs text-brand-text/55">Las tallas tachadas están agotadas en este color.</p>}
            {error && <p role="alert" className="mt-2 font-ui text-sm font-semibold text-red-700">{error}</p>}
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-brand-primary/25">
              <button type="button" aria-label="Restar uno" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-14 w-14 place-items-center text-brand-primary"><Minus className="h-4 w-4" /></button>
              <span className="w-8 text-center font-ui text-base font-semibold" aria-live="polite">{qty}</span>
              <button type="button" aria-label="Sumar uno" onClick={() => setQty((q) => Math.min(20, q + 1))} className="grid h-14 w-14 place-items-center text-brand-primary"><Plus className="h-4 w-4" /></button>
            </div>
            <button type="button" onClick={handleAdd} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-[#1E4D24] font-ui text-sm font-semibold uppercase tracking-[0.16em] text-[#F8F5EA] shadow-[0_12px_26px_-14px_rgba(30,77,36,0.9)] transition-transform hover:-translate-y-0.5">
              {added ? <><Check className="h-4 w-4" /> Agregado</> : "Agregar al carrito"}
            </button>
          </div>
          <Link href={`/estudio?producto=${product.slug}`} className="group mt-3 flex h-14 items-center justify-center gap-2 rounded-full bg-[#F991C3] font-ui text-sm font-bold uppercase tracking-[0.14em] text-brand-text shadow-[0_12px_26px_-14px_rgba(249,145,195,1)] transition-transform hover:-translate-y-0.5">
            <Sparkles className="h-4 w-4 transition-transform duration-500 group-hover:rotate-12" />
            Personalizar con mi mascota (IA)
          </Link>

          <div className="mt-10 border-t border-brand-primary/15">
            {apparel && (
              <Accordion title="Guía de tallas (cm)">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[320px] text-center text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-widest text-brand-text/60">
                        <th className="py-2 text-left font-semibold">Talla</th><th className="font-semibold">Pecho</th><th className="font-semibold">Largo</th><th className="font-semibold">Manga</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SIZE_GUIDE.map((r) => (
                        <tr key={r.size} className="border-t border-brand-primary/10">
                          <td className="py-2 text-left font-semibold text-brand-primary">{r.size}</td><td>{r.chest}</td><td>{r.length}</td><td>{r.sleeve}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-xs text-brand-text/60">Medidas aproximadas de la prenda extendida (ancho de pecho). Si dudas, elige la talla superior.</p>
              </Accordion>
            )}
            <Accordion title="Cuidados del DTF">
              <ul className="list-disc space-y-1.5 pl-5">
                <li>Lava del revés con agua fría (máx. 30 °C).</li>
                <li>No uses cloro ni suavizante.</li>
                <li>Seca al aire o en secadora a temperatura baja.</li>
                <li>Plancha solo del revés, nunca directo sobre el estampado.</li>
                <li>No laves en seco.</li>
              </ul>
            </Accordion>
            <Accordion title="Entrega y pago">
              Pagas en Bs a tasa BCV (Pago Móvil o transferencia) o en USD con Binance Pay. Enviamos por Delivery Caracas, MRW, Zoom y Tealca, o retira en Guanare. Total estimado: {usd(product.priceUsd * qty)}.
            </Accordion>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-brand-primary/10 py-12 md:py-20">
          <div className="container-wide">
            <h2 className="font-display text-3xl font-semibold text-brand-primary md:text-4xl">También te puede encantar</h2>
          </div>
          <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide md:gap-8 md:px-10 lg:px-16">
            {related.map((p) => (
              <div key={p.id} className="w-[46vw] shrink-0 snap-start md:w-[26vw] lg:w-[21vw]">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Barra inferior móvil */}
      <div className="fixed inset-x-0 bottom-[calc(60px+env(safe-area-inset-bottom))] z-40 flex items-center gap-3 border-t border-brand-primary/10 bg-brand-bg/95 px-4 py-3 backdrop-blur md:hidden">
        <Price usdValue={product.priceUsd} />
        <button type="button" onClick={handleAdd} className="ml-auto flex h-12 flex-1 items-center justify-center rounded-full bg-[#1E4D24] font-ui text-xs font-semibold uppercase tracking-[0.14em] text-[#F8F5EA]">
          {added ? "Agregado ✓" : "Agregar al carrito"}
        </button>
      </div>
    </>
  );
}
