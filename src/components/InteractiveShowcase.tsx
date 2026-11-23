"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";
import type { Catalog, Product } from "@/lib/catalog";
import CatalogFilters from "@/components/CatalogFilters";
import ProductArt, { aspectOf } from "@/components/ProductArt";
import ClothingRailHero, { type GarmentKind, type RailGarment } from "@/components/ClothingRailHero";
import { formatBs } from "@/lib/bcv";

const RAIL_LABELS = { front: "Frente", back: "Espalda", close: "Cerrar", show: "Ver" };
const FALLBACK_COLORS = ["#F6F3EA", "#1E4D24", "#1F2320", "#E8DFC8"];
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function railKind(p: Product): GarmentKind {
  const text = `${p.formatSlug} ${p.name}`.toLowerCase();
  if (p.kind === "hoodie" || /hoodie|su[eé]ter|sweater/.test(text)) return "hoodie";
  if (/chaqueta|jacket/.test(text)) return "jacket";
  return "tee";
}

function toRailItem(p: Product, index: number, rate: number | null): RailGarment {
  const hex = p.colors.map((c) => c.hex).find((h) => HEX.test(h)) ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
  const bs = rate ? `Bs. ${formatBs(p.priceUsd * rate)} a tasa BCV` : "Bs. a tasa BCV del día";
  const details = [usd(p.priceUsd), bs, ...(p.colors.length ? [`Colores: ${p.colors.map((c) => c.name).join(", ")}`] : []), "Estampado DTF", ...(p.customizable ? ["Personalizable IA"] : [])];
  return {
    id: p.id,
    name: p.name,
    description: `${usd(p.priceUsd)} · ${bs}`,
    image: p.images.front || undefined,
    backImage: p.images.back || undefined,
    sideImage: p.images.profile || undefined,
    tag: p.badge && p.badge.length <= 7 ? p.badge : `$${p.priceUsd}`,
    kind: railKind(p),
    color: hex,
    details,
    href: `/producto/${p.slug}`,
    studioHref: `/estudio?producto=${p.slug}`,
  };
}

const spring = { type: "spring", stiffness: 140, damping: 18, mass: 0.8 } as const;
const pad = (n: number) => String(n).padStart(2, "0");
const usd = (n: number) => `$${n.toFixed(2)}`;
const widthByKind: Record<Product["kind"], string> = { tee: "100%", hoodie: "100%", mug: "78%", cooler: "74%", cap: "88%" };

const hasPhoto = (p: Product) => Boolean(p.images.profile || p.images.front || p.images.back);

function Garment3D({ product, color, turn, flipped }: { product: Product; color: string; turn: number; flipped: boolean }) {
  const photo = hasPhoto(product);
  const frontSrc = product.images.profile ?? product.images.front ?? product.images.back;
  const backSrc = product.images.back ?? frontSrc;
  const shadow = "drop-shadow-[0_14px_20px_rgba(0,0,0,0.14)]";
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

function ShelfItem({ product, onOpen }: { product: Product; onOpen: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      whileHover={{ y: -14 }}
      transition={spring}
      className="group flex min-w-0 flex-col justify-end text-left outline-none"
      aria-label={`Abrir ${product.name}`}
    >
      <div className="px-2">
        <Garment3D product={product} color={product.colors[0].hex} turn={hover ? -14 : 0} flipped={false} />
      </div>
      <motion.div aria-hidden className="mx-auto mt-1 h-2 w-3/5 rounded-[50%] bg-brand-text/25 blur-md" animate={{ scaleX: hover ? 0.7 : 1, opacity: hover ? 0.5 : 1 }} transition={spring} />
      <div className="mt-4 flex min-h-[4.5rem] flex-col items-center gap-1.5 text-center">
        <Badge text={product.badge} />
        <span className="font-display text-base leading-tight text-brand-primary">{product.name}</span>
        <Price p={product} />
      </div>
    </motion.button>
  );
}

function ShelfMobile({ list, onOpen }: { list: Product[]; onOpen: (i: number) => void }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const idx = Math.max(0, list.findIndex((p) => p.id === activeId));
  const active = list[idx];

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
    if (next !== activeId) setActiveId(next);
  }

  return (
    <div>
      <div onScroll={onScroll} className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-[19vw] pb-2 scrollbar-hide">
        {list.map((p, i) => (
          <motion.div key={p.id} animate={{ opacity: i === idx ? 1 : 0.65, scale: i === idx ? 1 : 0.86 }} transition={spring} className="w-[62vw] shrink-0 snap-center">
            <Garment3D product={p} color={p.colors[0].hex} turn={0} flipped={false} />
            <div className="-mx-4 mt-1 h-3 rounded-sm bg-gradient-to-b from-stone-100 to-stone-300 shadow-[0_12px_20px_-10px_rgba(20,38,22,0.35)]" />
          </motion.div>
        ))}
      </div>
      <div className="mt-3 flex flex-col items-center gap-1 px-6 text-center">
        <Badge text={active.badge} />
        <p className="font-display text-xl text-brand-primary">{active.name}</p>
        <Price p={active} />
        <p className="mt-1 font-ui text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-primary/50">
          {pad(idx + 1)} / {pad(list.length)}
        </p>
      </div>
      <div className="mt-4 px-1">
        <button type="button" onClick={() => onOpen(idx)} className="flex h-14 w-full items-center justify-center rounded-full bg-brand-primary font-ui text-xs font-semibold uppercase tracking-widest text-brand-on-primary active:scale-95">
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
              Personalizar con IA
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
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/bcv")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d?.rate) setRate(d.rate);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const mode = formats.find((f) => f.slug === format)?.displayMode ?? "rack";
  const list = useMemo(() => {
    const base = products.filter((p) => {
      const byDept = department === "destacados" ? p.featured : p.departmentSlug === department;
      const byFormat = format === "todo" ? p.displayMode === "rack" : p.formatSlug === format;
      return byDept && byFormat;
    });
    if (department !== "destacados" || format !== "todo") return base;
    const filler = products.filter((p) => p.displayMode === "rack" && !base.includes(p));
    return [...base, ...filler].slice(0, 7);
  }, [products, department, format]);
  const railItems = useMemo(() => list.map((p, i) => toRailItem(p, i, rate)), [list, rate]);
  const filterKey = `${department}-${format}`;
  const safeOpen = open !== null && open < list.length ? open : null;

  return (
    <section className="bg-brand-bg pb-12 pt-4 md:pb-20 md:pt-6" aria-label="Catálogo">
      <div className="container-wide">
        <h1 className="sr-only">So Guau · Moda que deja huellas</h1>
        <CatalogFilters
          departments={departments}
          formats={formats}
          department={department}
          format={format}
          onDepartment={(s) => setDepartment(s)}
          onFormat={(s) => setFormat(s)}
        />
      </div>

      <div className="container-wide mt-3 md:mt-4">
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
                {mode === "rack" ? (
                  <ClothingRailHero
                    key={filterKey}
                    items={railItems}
                    hanger="wood"
                    labels={RAIL_LABELS}
                    initialActive={Math.floor(railItems.length / 2)}
                    action={
                      <Link href="/tienda" className="inline-flex items-center rounded-full bg-brand-primary px-8 py-3 font-ui text-xs font-semibold uppercase tracking-widest text-brand-on-primary transition hover:-translate-y-0.5">
                        Ver colección
                      </Link>
                    }
                    caption="Pasa el cursor o arrastra las prendas · Toca cualquiera para girar 360° y ver detalles" />
                ) : (
                  <>
                    <div className="hidden md:block">
                      <div className="overflow-x-auto scrollbar-hide">
                        <div className="grid gap-4 pb-2 pt-1" style={{ gridTemplateColumns: `repeat(${list.length}, minmax(11.5rem, 1fr))` }}>
                          {list.map((p, i) => (
                            <ShelfItem key={p.id} product={p} onOpen={() => setOpen(i)} />
                          ))}
                        </div>
                      </div>
                      <div className="relative -mt-14">
                        <div className="h-5 rounded-sm bg-gradient-to-b from-stone-100 to-stone-300 shadow-[0_18px_30px_-12px_rgba(20,38,22,0.35)]" />
                        <div className="mx-6 h-2 rounded-b bg-stone-400/60" />
                      </div>
                    </div>
                    <div className="md:hidden">
                      <ShelfMobile key={filterKey} list={list} onOpen={setOpen} />
                    </div>
                  </>
                )}
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
