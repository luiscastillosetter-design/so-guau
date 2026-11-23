"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCw, Sparkles, X } from "lucide-react";
import type { Catalog, Product } from "@/lib/catalog";
import CatalogFilters from "@/components/CatalogFilters";
import ProductArt, { aspectOf } from "@/components/ProductArt";

const spring = { type: "spring", stiffness: 140, damping: 18, mass: 0.8 } as const;
const pad = (n: number) => String(n).padStart(2, "0");
const usd = (n: number) => `$${n.toFixed(2)}`;
const widthByKind: Record<Product["kind"], string> = { tee: "100%", hoodie: "100%", mug: "78%", cooler: "74%", cap: "88%" };

const hasPhoto = (p: Product) => Boolean(p.images.profile || p.images.front || p.images.back);

function Garment3D({ product, color, turn, flipped }: { product: Product; color: string; turn: number; flipped: boolean }) {
  const photo = hasPhoto(product);
  const frontSrc = product.images.profile ?? product.images.front ?? product.images.back;
  const backSrc = product.images.back ?? frontSrc;
  const shadow = "drop-shadow-[0_18px_22px_rgba(20,38,22,0.16)]";
  return (
    <div style={{ perspective: 900 }} className="mx-auto">
      <motion.div style={{ transformStyle: "preserve-3d", transformOrigin: photo ? "50% 0%" : undefined }} animate={{ rotateY: turn }} transition={spring}>
        <motion.div
          className="relative mx-auto"
          style={{ transformStyle: "preserve-3d", aspectRatio: photo ? "3 / 4" : aspectOf[product.kind], width: photo ? "100%" : widthByKind[product.kind] }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={spring}
        >
          {photo ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={frontSrc} alt={product.name} draggable={false} className={`absolute inset-0 h-full w-full object-contain ${shadow}`} style={{ backfaceVisibility: "hidden" }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={backSrc} alt="" aria-hidden draggable={false} className={`absolute inset-0 h-full w-full object-contain ${shadow}`} style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }} />
            </>
          ) : (
            <>
              <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
                <ProductArt product={product} color={color} view="front" />
              </div>
              <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                <ProductArt product={product} color={color} view="back" />
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

const brushed =
  "repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0 1px, rgba(0,0,0,0.05) 1px 2px), linear-gradient(180deg, #f4f3ef 0%, #cfcdc6 28%, #8f8d87 62%, #b9b7b0 100%)";

function RackBar({ slim = false }: { slim?: boolean }) {
  return (
    <div className="relative z-10 mx-auto px-3" aria-hidden>
      <div className={`relative rounded-full ${slim ? "h-2" : "h-[11px]"}`} style={{ backgroundImage: brushed, boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset, 0 14px 16px -10px rgba(20,38,22,0.35), 0 3px 4px -1px rgba(20,38,22,0.18)" }}>
        <span className="absolute -left-2 top-1/2 h-5 w-2.5 -translate-y-1/2 rounded-[3px]" style={{ backgroundImage: "linear-gradient(90deg, #a9a7a0, #e4e2db 45%, #84827c)" }} />
        <span className="absolute -right-2 top-1/2 h-5 w-2.5 -translate-y-1/2 rounded-[3px]" style={{ backgroundImage: "linear-gradient(90deg, #a9a7a0, #e4e2db 45%, #84827c)" }} />
      </div>
    </div>
  );
}

function Hanger() {
  return (
    <svg viewBox="0 0 120 46" className="relative z-10 mx-auto -mb-3 h-11 w-28 text-zinc-500" aria-hidden>
      <path d="M60 22 V16 Q60 4 69 4 Q78 4 78 12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M60 22 L10 42 H110 Z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Badge({ text }: { text?: string }) {
  if (!text) return null;
  const sale = text.startsWith("-");
  return (
    <span className="flex flex-col items-center" aria-label={text}>
      <span aria-hidden className="h-3 w-px bg-brand-primary/30" />
      <span className={`rounded-[2px] px-2.5 py-1 font-ui text-[8.5px] font-semibold uppercase tracking-[0.28em] ${sale ? "bg-brand-accent/90 text-brand-text" : "border border-brand-primary/25 bg-brand-bg text-brand-primary/80"}`}>
        {text}
      </span>
    </span>
  );
}

function Price({ p }: { p: Product }) {
  return (
    <span className="font-ui text-sm font-semibold text-brand-primary">
      {usd(p.priceUsd)}
      {p.compareAtUsd && <s className="ml-2 text-xs font-normal text-brand-text/45">{usd(p.compareAtUsd)}</s>}
    </span>
  );
}

function DesktopItem({ product, mode, onOpen }: { product: Product; mode: "rack" | "shelf"; onOpen: () => void }) {
  const [hover, setHover] = useState(false);
  const rack = mode === "rack";
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      whileHover={rack ? undefined : { y: -14 }}
      transition={spring}
      className={`group flex min-w-0 flex-col text-left outline-none ${rack ? "" : "justify-end"}`}
      aria-label={`Abrir ${product.name}`}
    >
      {rack && !hasPhoto(product) && <Hanger />}
      {rack && hasPhoto(product) && <span aria-hidden className="mx-auto h-3 w-px bg-zinc-400" />}
      <div className="px-2">
        <Garment3D product={product} color={product.colors[0].hex} turn={rack ? (hover ? 0 : hasPhoto(product) ? -24 : -68) : hover ? -14 : 0} flipped={false} />
      </div>
      {!rack && (
        <motion.div aria-hidden className="mx-auto mt-1 h-2 w-3/5 rounded-[50%] bg-brand-text/25 blur-md" animate={{ scaleX: hover ? 0.7 : 1, opacity: hover ? 0.5 : 1 }} transition={spring} />
      )}
      <div className="mt-4 flex min-h-[4.5rem] flex-col items-center gap-1.5 text-center">
        <Badge text={product.badge} />
        <motion.div animate={{ opacity: rack ? (hover ? 1 : 0) : 1, y: rack && !hover ? 6 : 0 }} transition={{ duration: 0.3 }} className="flex flex-col items-center gap-0.5">
          <span className="font-display text-base leading-tight text-brand-primary">{product.name}</span>
          <Price p={product} />
        </motion.div>
      </div>
    </motion.button>
  );
}

function MobileCarousel({ list, mode, onOpen }: { list: Product[]; mode: "rack" | "shelf"; onOpen: (i: number) => void }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const idx = Math.max(0, list.findIndex((p) => p.id === activeId));
  const active = list[idx];
  const rack = mode === "rack";

  function onScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const mid = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    Array.from(el.children).forEach((c, i) => {
      const node = c as HTMLElement;
      const d = Math.abs(node.offsetLeft + node.offsetWidth / 2 - mid);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    const next = list[best]?.id ?? null;
    if (next !== activeId) {
      setActiveId(next);
      setFlipped(false);
    }
  }

  return (
    <div>
      <div onScroll={onScroll} className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-[19vw] pb-2 scrollbar-hide">
        {list.map((p, i) => {
          const rel = i - idx;
          const isActive = rel === 0;
          return (
            <motion.div
              key={p.id}
              animate={{ opacity: isActive ? 1 : 0.65, scale: isActive ? 1 : 0.86 }}
              transition={spring}
              className="w-[62vw] shrink-0 snap-center"
            >
              {rack && !hasPhoto(p) && <Hanger />}
              {rack && hasPhoto(p) && <span aria-hidden className="mx-auto block h-3 w-px bg-zinc-400" />}
              <Garment3D product={p} color={p.colors[0].hex} turn={isActive ? 0 : rel < 0 ? 62 : -62} flipped={isActive && flipped} />
              {!rack && <div className="-mx-4 mt-1 h-3 rounded-sm bg-gradient-to-b from-stone-100 to-stone-300 shadow-[0_12px_20px_-10px_rgba(20,38,22,0.35)]" />}
            </motion.div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-col items-center gap-1 px-6 text-center">
        <Badge text={active.badge} />
        <p className="font-display text-xl text-brand-primary">{active.name}</p>
        <Price p={active} />
        <p className="mt-1 font-ui text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-primary/50">
          {pad(idx + 1)} / {pad(list.length)}
        </p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 px-1">
        <button type="button" onClick={() => setFlipped((f) => !f)} className="flex h-14 items-center justify-center gap-2 rounded-full border border-brand-primary/30 font-ui text-xs font-semibold uppercase tracking-widest text-brand-primary active:scale-95">
          <RotateCw className="h-4 w-4" />
          {flipped ? "Espalda" : "Frente"}
        </button>
        <button type="button" onClick={() => onOpen(idx)} className="flex h-14 items-center justify-center rounded-full bg-brand-primary font-ui text-xs font-semibold uppercase tracking-widest text-brand-on-primary active:scale-95">
          Ver / Personalizar
        </button>
      </div>
    </div>
  );
}

function FocusPanel({ list, index, onIndex, onClose }: { list: Product[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const p = list[index];
  const [colorIdx, setColorIdx] = useState(0);
  const [back, setBack] = useState(false);
  const color = p.colors[colorIdx]?.hex ?? p.colors[0].hex;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % list.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + list.length) % list.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, list.length, onClose, onIndex]);

  return (
    <motion.div className="fixed inset-0 z-[70] flex items-end justify-center bg-brand-text/50 backdrop-blur-sm md:items-center md:p-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={p.name}
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={spring}
        className="grid max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-t-[2rem] bg-brand-bg md:grid-cols-2 md:rounded-[2rem]"
      >
        <div className="relative grid place-items-center bg-brand-primary/[0.06] px-10 py-10 md:min-h-[34rem]">
          <p className="absolute left-6 top-6 font-display text-3xl text-brand-primary">
            {pad(index + 1)} <span className="text-brand-primary/40">/ {pad(list.length)}</span>
          </p>
          <div className="w-full max-w-sm">
            <Garment3D key={p.id} product={p} color={color} turn={0} flipped={back} />
          </div>
          <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-between">
            <button type="button" aria-label="Anterior" onClick={() => onIndex((index - 1 + list.length) % list.length)} className="grid h-11 w-11 place-items-center rounded-full bg-brand-bg/80 text-brand-primary transition hover:scale-110">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" aria-label="Siguiente" onClick={() => onIndex((index + 1) % list.length)} className="grid h-11 w-11 place-items-center rounded-full bg-brand-bg/80 text-brand-primary transition hover:scale-110">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div key={p.id} className="flex flex-col gap-6 p-8 md:p-12">
          <div className="flex items-start justify-between gap-4">
            <Badge text={p.badge} />
            <button type="button" aria-label="Cerrar" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-brand-primary/20 text-brand-primary transition hover:rotate-90">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div>
            <h3 className="font-display text-4xl leading-tight text-brand-primary md:text-5xl">{p.name}</h3>
            <div className="mt-3 text-lg">
              <Price p={p} />
            </div>
          </div>
          <div>
            <p className="mb-3 font-ui text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-primary/60">Vista</p>
            <div className="inline-flex rounded-full border border-brand-primary/20 p-1">
              {[false, true].map((b) => (
                <button key={String(b)} type="button" onClick={() => setBack(b)} className={`rounded-full px-6 py-2 font-ui text-xs font-semibold uppercase tracking-widest transition ${back === b ? "bg-brand-primary text-brand-on-primary" : "text-brand-primary"}`}>
                  {b ? "Espalda" : "Frente"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 font-ui text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-primary/60">Color — {p.colors[colorIdx]?.name}</p>
            <div className="flex gap-3">
              {p.colors.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  aria-label={c.name}
                  onClick={() => setColorIdx(i)}
                  className={`h-10 w-10 rounded-full border border-brand-text/20 transition hover:scale-110 ${i === colorIdx ? "ring-2 ring-brand-accent ring-offset-2 ring-offset-brand-bg" : ""}`}
                  style={{ background: c.hex }}
                />
              ))}
            </div>
          </div>
          <div className="mt-auto flex flex-col gap-3 sm:flex-row">
            <Link href={`/producto/${p.slug}`} className="flex-1 rounded-full border border-brand-primary px-6 py-4 text-center font-ui text-xs font-semibold uppercase tracking-widest text-brand-primary transition hover:bg-brand-primary hover:text-brand-on-primary">
              Ver ficha
            </Link>
            <Link href={`/estudio?producto=${p.slug}`} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-accent px-6 py-4 text-center font-ui text-xs font-bold uppercase tracking-widest text-brand-text transition hover:-translate-y-0.5">
              <Sparkles className="h-4 w-4" />
              Personalizar este diseño
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function InteractiveShowcase({ catalog }: { catalog: Catalog }) {
  const { departments, formats, products } = catalog;
  const [department, setDepartment] = useState("destacados");
  const [format, setFormat] = useState("todo");
  const [open, setOpen] = useState<number | null>(null);

  const mode = formats.find((f) => f.slug === format)?.displayMode ?? "rack";
  const list = useMemo(
    () =>
      products.filter((p) => {
        const byDept = department === "destacados" ? p.featured : p.departmentSlug === department;
        const byFormat = format === "todo" ? p.displayMode === "rack" : p.formatSlug === format;
        return byDept && byFormat;
      }),
    [products, department, format],
  );
  const filterKey = `${department}-${format}`;
  const safeOpen = open !== null && open < list.length ? open : null;

  return (
    <section className="bg-brand-bg pb-16 pt-10 md:pb-24 md:pt-16" aria-label="Catálogo">
      <div className="container-wide">
        <div className="mb-8 flex flex-col gap-2 md:mb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-ui text-[10px] font-semibold uppercase tracking-[0.35em] text-brand-primary/70">El perchero · Colección So Guau</p>
            <h1 className="mt-3 font-display text-4xl leading-[1.05] text-brand-primary md:text-6xl lg:text-7xl">
              Moda que deja <em className="text-brand-accent">huellas</em>
            </h1>
          </div>
          <p className="max-w-sm font-ui text-sm leading-relaxed text-brand-text/70 md:text-right">
            {mode === "rack" ? "Pasa el cursor por una prenda y mírala de frente. Toca para ver los detalles." : "Piezas de repisa: elige color, mírala de cerca y personalízala."}
          </p>
        </div>

        <CatalogFilters
          departments={departments}
          formats={formats}
          department={department}
          format={format}
          onDepartment={(s) => setDepartment(s)}
          onFormat={(s) => setFormat(s)}
        />
      </div>

      <div className="container-wide mt-8 md:mt-12">
        <AnimatePresence mode="wait">
          <motion.div key={`${mode}-${filterKey}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
            {list.length === 0 ? (
              <div className="grid min-h-[22rem] place-items-center rounded-[2rem] border border-dashed border-brand-primary/25 text-center">
                <div>
                  <p className="font-display text-3xl italic text-brand-primary">Esta combinación llega pronto</p>
                  <p className="mt-2 font-ui text-sm text-brand-text/70">Prueba otro tema o créala tú con IA.</p>
                </div>
              </div>
            ) : (
              <>
                {/* PC */}
                <div className="hidden md:block">
                  {mode === "rack" && (
                    <RackBar />
                  )}
                  <div className="-mt-2 overflow-x-auto scrollbar-hide">
                    <div className="grid gap-4 pb-2 pt-1" style={{ gridTemplateColumns: `repeat(${list.length}, minmax(11.5rem, 1fr))` }}>
                      {list.map((p, i) => (
                        <DesktopItem key={p.id} product={p} mode={mode} onOpen={() => setOpen(i)} />
                      ))}
                    </div>
                  </div>
                  {mode === "shelf" && (
                    <div className="relative -mt-14">
                      <div className="h-5 rounded-sm bg-gradient-to-b from-stone-100 to-stone-300 shadow-[0_18px_30px_-12px_rgba(20,38,22,0.35)]" />
                      <div className="mx-6 h-2 rounded-b bg-stone-400/60" />
                    </div>
                  )}
                </div>
                {/* Móvil */}
                <div className="md:hidden">
                  {mode === "rack" && <RackBar slim />}
                  <MobileCarousel key={filterKey} list={list} mode={mode} onOpen={setOpen} />
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {safeOpen !== null && <FocusPanel list={list} index={safeOpen} onIndex={setOpen} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </section>
  );
}
