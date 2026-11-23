"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";
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

function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(min-width: 768px)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(min-width: 768px)").matches,
    () => true,
  );
}

const SQUASH = 0.38;
const tagOf = (p: Product) => p.badge || (p.customizable ? "PERSONALIZABLE" : "");

function RackItem({ product, active, open, closed, onActivate, onOpen }: { product: Product; active: boolean; open: number; closed: number; onActivate: () => void; onOpen: () => void }) {
  const frontSrc = product.images.front ?? product.images.back;
  const profileSrc = product.images.profile;
  const photo = Boolean(frontSrc || profileSrc);
  const shadow = "drop-shadow-[0_14px_20px_rgba(0,0,0,0.14)]";
  const tag = tagOf(product);
  const tagCls = tag.startsWith("-") ? "text-brand-accent" : "text-brand-primary/70";
  const squash = !active && !profileSrc;
  return (
    <motion.div animate={{ width: active ? open : closed }} transition={spring} onMouseEnter={onActivate} className="relative shrink-0">
      <div className="flex h-9 items-end justify-center">
        {tag &&
          (active ? (
            <span className={`mb-1 whitespace-nowrap font-ui text-[8.5px] font-semibold uppercase tracking-[0.28em] ${tagCls}`}>{tag}</span>
          ) : (
            <span className={`mb-1 max-h-9 overflow-hidden font-ui text-[6.5px] font-semibold uppercase tracking-[0.2em] [writing-mode:vertical-rl] ${tagCls}`}>{tag}</span>
          ))}
      </div>
      <svg viewBox="0 0 40 18" className="relative z-10 mx-auto -mb-1 h-[18px] w-10 text-neutral-700" aria-hidden>
        <path d="M20 0 V6 Q20 9 23 9 Q27 9 27 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M20 9 V11 L4 17 H36 L20 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <button
        type="button"
        onClick={() => (active ? onOpen() : onActivate())}
        onFocus={onActivate}
        aria-label={active ? `Abrir ${product.name}` : `Ver ${product.name}`}
        className="relative block h-[300px] w-full cursor-pointer outline-none md:h-[370px]"
      >
        <motion.div
          className="absolute left-1/2 top-0 h-full -translate-x-1/2"
          style={{ transformOrigin: "50% 0%" }}
          initial={false}
          animate={{ width: active ? open : profileSrc ? closed : closed / SQUASH, scaleX: squash ? SQUASH : 1 }}
          transition={spring}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={active ? (frontSrc ?? profileSrc) : (profileSrc ?? frontSrc)} alt={product.name} draggable={false} className={`h-full w-full object-contain object-top ${shadow} ${squash ? "brightness-95" : ""}`} />
          ) : (
            <div className={`h-full w-full ${squash ? "brightness-95" : ""}`}>
              <ProductArt product={product} color={product.colors[0].hex} view="front" />
            </div>
          )}
        </motion.div>
      </button>
    </motion.div>
  );
}

function AccordionRack({ list, onOpen }: { list: Product[]; onOpen: (i: number) => void }) {
  const desktop = useIsDesktop();
  const open = desktop ? 270 : 220;
  const closed = desktop ? 84 : 64;
  const [activeIdx, setActiveIdx] = useState(0);
  const idx = Math.min(activeIdx, list.length - 1);
  const active = list[idx];
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const center = idx * closed + open / 2 + 16;
    el.scrollTo({ left: Math.max(0, center - el.clientWidth / 2), behavior: "smooth" });
  }, [idx, open, closed]);

  const go = (d: number) => setActiveIdx((i) => Math.min(list.length - 1, Math.max(0, i + d)));

  return (
    <div>
      <motion.div
        ref={scroller}
        className="overflow-x-auto overflow-y-hidden pb-2 scrollbar-hide"
        style={{ touchAction: "pan-y" }}
        onPanEnd={(_, info) => {
          if (Math.abs(info.offset.x) > 40 && Math.abs(info.offset.x) > Math.abs(info.offset.y)) go(info.offset.x < 0 ? 1 : -1);
        }}
      >
        <div className="relative w-max min-w-full">
          <div aria-hidden className="absolute inset-x-0 top-[35px] z-0 h-[2px] bg-neutral-800/80 shadow-[0_2px_4px_rgba(0,0,0,0.22)]" />
          <div className="relative flex justify-center px-4">
            {list.map((p, i) => (
              <RackItem key={p.id} product={p} active={i === idx} open={open} closed={closed} onActivate={() => setActiveIdx(i)} onOpen={() => onOpen(i)} />
            ))}
          </div>
        </div>
      </motion.div>
      <div className="mt-4 flex flex-col items-center gap-1.5 px-6 text-center">
        <p className="font-ui text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-primary/50">
          {pad(idx + 1)} / {pad(list.length)}
        </p>
        <p className="font-display text-2xl text-brand-primary md:text-3xl">{active.name}</p>
        <p className="font-ui text-xs text-brand-text/60">
          {active.customizable ? "Personalizable con IA" : "Edición So Guau"} · <Price p={active} />
        </p>
        <button type="button" onClick={() => onOpen(idx)} className="mt-2 rounded-full bg-brand-primary px-8 py-3 font-ui text-xs font-semibold uppercase tracking-widest text-brand-on-primary transition hover:-translate-y-0.5 active:scale-95">
          Ver prenda
        </button>
      </div>
    </div>
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
            {mode === "rack" ? "Pasa el cursor o desliza para abrir una prenda. Toca la prenda abierta para verla de cerca." : "Piezas de repisa: elige color, mírala de cerca y personalízala."}
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
                {mode === "rack" ? (
                  <AccordionRack key={filterKey} list={list} onOpen={setOpen} />
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
