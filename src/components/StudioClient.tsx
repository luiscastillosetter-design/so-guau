"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Layers, Loader2, MessageCircle, Newspaper, Sparkles, Trash2, Upload, UploadCloud, X } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { useCart } from "@/context/CartContext";
import Price from "@/components/Price";
import WatermarkedPreview from "@/components/WatermarkedPreview";
import { SINGLE_SIZE, sizesFor } from "@/lib/shop";
import { FREE_TRIES, GARMENTS, MAX_PHOTO_BYTES, POSITIONS, WINDOW_MS, type PositionId, type StudioTemplate, type TemplateMode } from "@/lib/studio-config";
import { useStoredJson } from "@/lib/useStoredJson";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const STEPS = ["Prenda", "Estilo", "Mascota"];
const ICONS: Record<TemplateMode, typeof Sparkles> = { gema: Sparkles, torre: Layers, editorial: Newspaper, libre: Upload };

interface Lead { name: string; whatsapp: string }
interface Tries { used: number; at: number }
interface Photo { id: string; file: File; url: string }
interface Result { previewDataUrl: string; cleanStoragePath: string; originalPaths: string[]; demoMode: boolean }

const NO_LEAD: Lead | null = null;
const NO_TRIES: Tries | null = null;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("imagen"));
    img.src = src;
  });
}

function drawScaled(img: HTMLImageElement, max: number) {
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.naturalWidth * scale));
  c.height = Math.max(1, Math.round(img.naturalHeight * scale));
  c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

/** Reduce la foto (máx. 1600 px) para no exceder el límite de cuerpo de la API. */
async function compress(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const canvas = drawScaled(await loadImage(url), 1600);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.88));
    return blob && blob.size < file.size ? new File([blob], `${file.name.replace(/\.\w+$/, "")}.webp`, { type: "image/webp" }) : file;
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function thumb(dataUrl: string) {
  return drawScaled(await loadImage(dataUrl), 360).toDataURL("image/webp", 0.85);
}

const field = "h-12 w-full rounded-xl border border-brand-primary/20 bg-white/60 px-4 font-ui text-sm outline-none transition-colors placeholder:text-brand-text/35 focus:border-brand-primary focus:bg-white";
const lbl = "mb-1.5 block font-ui text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-text/70";
const primaryBtn = "flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#1E4D24] font-ui text-sm font-semibold uppercase tracking-[0.16em] text-[#F8F5EA] shadow-[0_12px_26px_-14px_rgba(30,77,36,0.9)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60";

export default function StudioClient({ products, templates }: { products: Product[]; templates: StudioTemplate[] }) {
  const params = useSearchParams();
  const { addItem } = useCart();
  const [lead, setLead] = useStoredJson<Lead | null>("soguau-studio-lead", NO_LEAD);
  const [tries, setTries] = useStoredJson<Tries | null>("soguau-studio-tries", NO_TRIES);
  const [now] = useState(() => Date.now());
  const remaining = tries && now - tries.at < WINDOW_MS ? Math.max(0, FREE_TRIES - tries.used) : FREE_TRIES;

  const preselected = useMemo(() => products.find((p) => p.slug === params.get("producto")), [products, params]);
  const [kind, setKind] = useState(preselected?.kind ?? "tee");
  const [colorIdx, setColorIdx] = useState(0);
  const [pickedSize, setPickedSize] = useState("");
  const [position, setPosition] = useState<PositionId>("pecho");
  const [templateSlug, setTemplateSlug] = useState(templates[0]?.slug ?? "");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [petName, setPetName] = useState("");
  const [customText, setCustomText] = useState("");
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [limitUrl, setLimitUrl] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [modal, setModal] = useState(false);
  const [draft, setDraft] = useState<Lead>({ name: "", whatsapp: "" });
  const [dragging, setDragging] = useState(false);
  const [added, setAdded] = useState(false);
  const photosRef = useRef<Photo[]>([]);
  useEffect(() => {
    photosRef.current = photos;
  });
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const product = useMemo(() => {
    if (preselected && preselected.kind === kind) return preselected;
    const ofKind = products.filter((p) => p.kind === kind);
    return ofKind.find((p) => p.customizable) ?? ofKind[0] ?? products[0];
  }, [products, kind, preselected]);
  const color = product.colors[colorIdx] ?? product.colors[0];
  const sizes = sizesFor(kind);
  const apparel = sizes.length > 1;
  const size = apparel ? pickedSize : SINGLE_SIZE;
  const template = templates.find((t) => t.slug === templateSlug) ?? templates[0];
  const isLibre = template.mode === "libre";
  const showText = template.mode === "torre" || template.mode === "editorial";

  async function addFiles(list: FileList | File[]) {
    setError("");
    const room = template.maxPhotos - photos.length;
    const incoming = Array.from(list).slice(0, Math.max(0, room));
    const next: Photo[] = [];
    for (const f of incoming) {
      if (!ACCEPT.includes(f.type)) return setError("Solo se aceptan fotos JPG, PNG o WebP.");
      const file = await compress(f);
      if (file.size > MAX_PHOTO_BYTES) return setError("Cada foto debe pesar máximo 4 MB.");
      next.push({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) });
    }
    setPhotos((p) => [...p, ...next].slice(0, template.maxPhotos));
  }

  function removePhoto(id: string) {
    setPhotos((p) => {
      p.filter((x) => x.id === id).forEach((x) => URL.revokeObjectURL(x.url));
      return p.filter((x) => x.id !== id);
    });
  }

  function pickTemplate(slug: string) {
    setTemplateSlug(slug);
    const max = templates.find((t) => t.slug === slug)?.maxPhotos ?? 1;
    setPhotos((p) => {
      p.slice(max).forEach((x) => URL.revokeObjectURL(x.url));
      return p.slice(0, max);
    });
  }

  function canNext() {
    if (step === 0) return !apparel || Boolean(pickedSize);
    return true;
  }

  function start() {
    setError("");
    if (!photos.length) return setError("Sube al menos una foto.");
    if (!isLibre && petName.trim().length < 1) return setError("Escribe el nombre de tu mascota o una frase.");
    if (!lead) {
      setDraft({ name: "", whatsapp: "" });
      return setModal(true);
    }
    void generate(lead);
  }

  async function generate(who: Lead) {
    setBusy(true);
    setError("");
    setLimitUrl("");
    const fd = new FormData();
    fd.set("templateSlug", template.slug);
    fd.set("petName", petName);
    fd.set("customText", customText);
    fd.set("leadName", who.name);
    fd.set("leadWhatsapp", who.whatsapp);
    photos.forEach((p) => fd.append("photos", p.file));
    try {
      const res = await fetch("/api/studio/generate", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) {
        setTries({ used: FREE_TRIES, at: Date.now() });
        setLimitUrl(data.whatsappUrl ?? "");
      }
      if (!res.ok) throw new Error(data.error ?? "No pudimos generar tu diseño.");
      setResult({ previewDataUrl: data.previewDataUrl, cleanStoragePath: data.cleanStoragePath, originalPaths: data.originalPaths ?? [], demoMode: Boolean(data.demoMode) });
      setTries({ used: FREE_TRIES - Number(data.remainingTries ?? 0), at: Date.now() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setBusy(false);
    }
  }

  function submitLead(e: React.FormEvent) {
    e.preventDefault();
    const name = draft.name.trim();
    if (name.length < 2) return setError("Escribe tu nombre.");
    if (draft.whatsapp.replace(/\D/g, "").length < 10) return setError("Escribe un WhatsApp válido.");
    const who = { name, whatsapp: draft.whatsapp.trim() };
    setLead(who);
    setModal(false);
    void generate(who);
  }

  async function addToCart() {
    if (!result) return;
    const small = await thumb(result.previewDataUrl).catch(() => "");
    addItem({
      productId: product.id,
      slug: product.slug,
      name: `${product.name} personalizada`,
      priceUsd: product.priceUsd,
      color: color.name,
      colorHex: color.hex,
      size,
      imageUrl: small,
      isCustom: true,
      customData: { templateName: template.name, petName, previewUrl: small, originalFileUrl: result.cleanStoragePath, position: apparel ? position : "frente", originalPaths: result.originalPaths },
      kind,
      motif: "text",
      printText: "",
    });
    setAdded(true);
  }

  return (
    <div className="container-wide grid gap-6 py-6 md:py-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
      {/* Visor */}
      <div className="sticky top-[6.25rem] z-20 -mx-4 bg-brand-bg px-4 pb-2 md:-mx-10 md:px-10 lg:top-36 lg:z-auto lg:mx-0 lg:self-start lg:px-0">
        <div className="overflow-hidden rounded-3xl border border-brand-primary/10">
          <WatermarkedPreview kind={kind} color={color.hex} position={position} artUrl={result?.previewDataUrl} className="h-[34dvh] md:h-[46dvh] lg:h-[calc(100dvh-14rem)] lg:max-h-[720px]" />
        </div>
        <p className="mt-2 text-center font-ui text-[11px] text-brand-text/55">
          {result ? (result.demoMode ? "Modo demo: se muestra tu foto sin procesar por IA." : "Vista previa con marca de agua. El arte limpio se entrega con tu pedido.") : "Así se verá tu diseño. Completa los pasos para generarlo."}
        </p>
      </div>

      {/* Controles */}
      <div className="flex flex-col pb-28 lg:pb-0">
        <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.35em] text-brand-accent">Estudio IA</p>
        <h1 className="mt-1 font-display text-4xl font-semibold text-brand-primary md:text-5xl">Crea tu diseño</h1>

        {!result ? (
          <>
            <ol className="mt-6 grid grid-cols-3 gap-2" aria-label="Pasos">
              {STEPS.map((s, i) => (
                <li key={s}>
                  <button type="button" disabled={i > step} onClick={() => setStep(i)} aria-current={i === step} className={`flex h-12 w-full items-center justify-center gap-2 rounded-full border font-ui text-xs font-semibold uppercase tracking-[0.1em] transition-all ${i === step ? "border-brand-primary bg-brand-primary text-brand-on-primary" : i < step ? "border-brand-primary/40 text-brand-primary" : "border-brand-primary/15 text-brand-text/35"}`}>
                    {i < step ? <Check className="h-3.5 w-3.5" /> : <span>{i + 1}</span>} {s}
                  </button>
                </li>
              ))}
            </ol>

            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="mt-7 space-y-7">
                {step === 0 && (
                  <>
                    <div>
                      <p className={lbl}>Prenda u objeto</p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {GARMENTS.map((g) => (
                          <button key={g.kind} type="button" aria-pressed={kind === g.kind} onClick={() => { setKind(g.kind); setColorIdx(0); setPickedSize(""); if (!g.apparel) setPosition("pecho"); }} className={`min-h-12 rounded-xl border px-3 py-3 font-ui text-sm font-semibold transition-all ${kind === g.kind ? "border-brand-primary bg-brand-primary text-brand-on-primary" : "border-brand-primary/20 text-brand-primary hover:border-brand-primary/60"}`}>
                            {g.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className={lbl}>Color: <span className="text-brand-primary">{color.name}</span></p>
                      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
                        {product.colors.map((c, i) => (
                          <button key={c.name} type="button" role="radio" aria-checked={i === colorIdx} aria-label={c.name} onClick={() => setColorIdx(i)} className={`grid h-12 w-12 place-items-center rounded-full ${i === colorIdx ? "ring-2 ring-brand-primary ring-offset-2 ring-offset-brand-bg" : ""}`}>
                            <span className="h-9 w-9 rounded-full border border-black/15" style={{ backgroundColor: c.hex }} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className={lbl}>Talla: <span className="text-brand-primary">{size || "Elige una"}</span></p>
                      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Talla">
                        {sizes.map((s) => (
                          <button key={s} type="button" role="radio" aria-checked={size === s} onClick={() => setPickedSize(s)} className={`h-12 min-w-14 rounded-full border px-5 font-ui text-sm font-semibold transition-all ${size === s ? "border-brand-primary bg-brand-primary text-brand-on-primary" : "border-brand-primary/25 text-brand-primary"}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    {apparel && (
                      <div>
                        <p className={lbl}>Posición del diseño</p>
                        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Posición">
                          {POSITIONS.map((p) => (
                            <button key={p.id} type="button" role="radio" aria-checked={position === p.id} onClick={() => setPosition(p.id)} className={`min-h-12 rounded-xl border px-3 py-3 font-ui text-sm font-semibold transition-all ${position === p.id ? "border-brand-primary bg-brand-primary text-brand-on-primary" : "border-brand-primary/20 text-brand-primary"}`}>
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {step === 1 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {templates.map((t) => {
                      const Icon = ICONS[t.mode];
                      const active = t.slug === templateSlug;
                      return (
                        <button key={t.slug} type="button" aria-pressed={active} onClick={() => pickTemplate(t.slug)} className={`group flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-all hover:-translate-y-1 ${active ? "border-brand-primary bg-brand-primary text-brand-on-primary shadow-[0_18px_30px_-20px_rgba(30,77,36,0.9)]" : "border-brand-primary/20 bg-white/40 text-brand-primary"}`}>
                          <span className={`grid h-11 w-11 place-items-center rounded-full ${active ? "bg-brand-accent text-brand-text" : "bg-brand-primary/10"}`}><Icon className="h-5 w-5" /></span>
                          <span className="font-display text-xl leading-tight">{t.name}</span>
                          <span className={`font-ui text-xs ${active ? "opacity-85" : "text-brand-text/65"}`}>{t.tagline} · {t.maxPhotos > 1 ? `1 a ${t.maxPhotos} fotos` : "1 foto"}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {step === 2 && (
                  <>
                    <div>
                      <p className={lbl}>{template.maxPhotos > 1 ? `Fotos (1 a ${template.maxPhotos})` : isLibre ? "Tu imagen o logo" : "Foto de tu mascota"}</p>
                      <label
                        htmlFor="studio-photos"
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setDragging(false); void addFiles(e.dataTransfer.files); }}
                        className={`flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-5 text-center transition-colors ${dragging ? "border-brand-primary bg-brand-primary/5" : "border-brand-primary/30 bg-white/40 hover:border-brand-primary"}`}
                      >
                        <UploadCloud className="h-8 w-8 text-brand-primary/60" />
                        <span className="font-ui text-sm text-brand-text/75"><span className="md:hidden">Toca para elegir de tu galería</span><span className="hidden md:inline">Arrastra aquí o haz clic para elegir</span></span>
                        <span className="font-ui text-[11px] text-brand-text/50">JPG, PNG o WebP</span>
                      </label>
                      <input id="studio-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple={template.maxPhotos > 1} className="sr-only" onChange={(e) => { if (e.target.files) void addFiles(e.target.files); e.target.value = ""; }} />
                      {photos.length > 0 && (
                        <ul className="mt-3 flex gap-3">
                          {photos.map((p) => (
                            <li key={p.id} className="relative h-24 w-24 overflow-hidden rounded-xl border border-brand-primary/15">
                              <div role="img" aria-label="Foto subida" className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${p.url})` }} />
                              <button type="button" onClick={() => removePhoto(p.id)} aria-label="Quitar foto" className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-full bg-brand-bg/90 text-brand-primary"><Trash2 className="h-4 w-4" /></button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <label htmlFor="petName" className={lbl}>{isLibre ? "Nombre o frase (opcional)" : "Nombre de tu mascota o frase"}</label>
                      <input id="petName" value={petName} maxLength={40} onChange={(e) => setPetName(e.target.value)} className={field} placeholder="Ej. LUNA" />
                    </div>
                    {showText && (
                      <div>
                        <label htmlFor="customText" className={lbl}>{template.mode === "editorial" ? "Texto (Cat Mom, Dog Dad…)" : "Texto superior o inferior (opcional)"}</label>
                        <input id="customText" value={customText} maxLength={60} onChange={(e) => setCustomText(e.target.value)} className={field} placeholder={template.mode === "editorial" ? "CAT MOM" : "LESS PEOPLE, MORE DOGS"} />
                      </div>
                    )}
                    <p className="rounded-xl bg-brand-primary/5 px-4 py-3 font-ui text-xs text-brand-text/75">
                      Pruebas gratis disponibles: <strong className="text-brand-primary">{remaining} de {FREE_TRIES}</strong>
                    </p>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 font-ui text-sm font-semibold text-red-700">{error}</p>}
            {limitUrl && (
              <a href={limitUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex h-12 items-center justify-center gap-2 rounded-full bg-[#F991C3] font-ui text-xs font-bold uppercase tracking-[0.14em] text-brand-text">
                <MessageCircle className="h-4 w-4" /> Escribir por WhatsApp
              </a>
            )}

            <div className="fixed inset-x-0 bottom-[calc(60px+env(safe-area-inset-bottom))] z-40 flex gap-3 border-t border-brand-primary/10 bg-brand-bg/95 px-4 py-3 backdrop-blur md:static md:z-auto md:mt-8 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
              {step > 0 && (
                <button type="button" onClick={() => setStep(step - 1)} aria-label="Paso anterior" className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-brand-primary/25 text-brand-primary"><ArrowLeft className="h-5 w-5" /></button>
              )}
              {step < 2 ? (
                <button type="button" disabled={!canNext()} onClick={() => setStep(step + 1)} className={primaryBtn}>{canNext() ? "Continuar" : "Elige tu talla"}</button>
              ) : (
                <button type="button" disabled={busy || remaining === 0} onClick={start} className={primaryBtn}>
                  {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Creando tu diseño…</> : <><Sparkles className="h-4 w-4" /> Generar mi diseño</>}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="rounded-2xl border border-brand-primary/15 bg-white/50 p-5">
              <p className="font-display text-2xl text-brand-primary">{product.name} personalizada</p>
              <p className="mt-1 font-ui text-xs text-brand-text/65">{template.name} · {color.name} · {size}{apparel ? ` · ${POSITIONS.find((p) => p.id === position)?.label}` : ""}{petName ? ` · ${petName}` : ""}</p>
              <Price usdValue={product.priceUsd} size="lg" className="mt-4" />
            </div>
            {apparel && (
              <div>
                <p className={lbl}>Posición</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {POSITIONS.map((p) => (
                    <button key={p.id} type="button" aria-pressed={position === p.id} onClick={() => setPosition(p.id)} className={`min-h-12 rounded-xl border px-3 py-3 font-ui text-sm font-semibold ${position === p.id ? "border-brand-primary bg-brand-primary text-brand-on-primary" : "border-brand-primary/20 text-brand-primary"}`}>{p.label}</button>
                  ))}
                </div>
              </div>
            )}
            <button type="button" onClick={addToCart} className={primaryBtn}>{added ? <><Check className="h-4 w-4" /> Agregado al carrito</> : "Agregar mi diseño al carrito"}</button>
            {added && <Link href="/checkout" className="flex h-14 items-center justify-center rounded-full border border-brand-primary font-ui text-sm font-semibold uppercase tracking-[0.16em] text-brand-primary">Ir al checkout</Link>}
            <button type="button" onClick={() => { setResult(null); setAdded(false); setStep(2); }} className="block w-full py-2 text-center font-ui text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary underline-offset-4 hover:underline">
              Probar otra versión ({remaining} de {FREE_TRIES} gratis)
            </button>
          </div>
        )}
      </div>

      {/* Registro relámpago */}
      <AnimatePresence>
        {modal && (
          <motion.div className="fixed inset-0 z-[70] flex items-end justify-center bg-brand-text/50 p-0 backdrop-blur-[2px] md:items-center md:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(false)}>
            <motion.form
              role="dialog"
              aria-modal="true"
              aria-label="Registro rápido"
              onSubmit={submitLead}
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-md space-y-4 rounded-t-3xl bg-brand-bg p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:rounded-3xl md:p-8"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-2xl text-brand-primary">¡Casi listo!</h2>
                  <p className="font-ui text-xs text-brand-text/65">Pruebas gratis disponibles: <strong>{remaining} de {FREE_TRIES}</strong></p>
                </div>
                <button type="button" onClick={() => setModal(false)} aria-label="Cerrar" className="grid h-11 w-11 place-items-center rounded-full text-brand-primary"><X className="h-5 w-5" /></button>
              </div>
              <div>
                <label htmlFor="lead-name" className={lbl}>Nombre</label>
                <input id="lead-name" required autoComplete="name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={field} />
              </div>
              <div>
                <label htmlFor="lead-wa" className={lbl}>WhatsApp</label>
                <input id="lead-wa" required type="tel" inputMode="tel" autoComplete="tel" value={draft.whatsapp} onChange={(e) => setDraft({ ...draft, whatsapp: e.target.value })} className={field} placeholder="0412-1234567" />
              </div>
              {error && <p role="alert" className="font-ui text-sm font-semibold text-red-700">{error}</p>}
              <button type="submit" className={primaryBtn}><Sparkles className="h-4 w-4" /> Generar mi diseño</button>
              <p className="text-center font-ui text-[11px] text-brand-text/50">Solo lo usamos para contactarte sobre tu diseño.</p>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
