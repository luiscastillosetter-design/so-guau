"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, ImagePlus, Loader2, MessageCircle, ShoppingBag } from "lucide-react";
import { useCart, type CartItem } from "@/context/CartContext";
import { CartThumb } from "@/components/CartDrawer";
import { formatBs } from "@/lib/bcv";
import { DELIVERY_METHODS, usd, type PaymentMethodId } from "@/lib/shop";
import type { StoreSettings } from "@/lib/store";

const MAX = 5 * 1024 * 1024;
const OK_TYPES = ["image/jpeg", "image/png", "image/webp"];

function CopyRow({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {
      /* portapapeles no disponible */
    }
  }
  return (
    <div className="flex items-center justify-between gap-3 border-b border-brand-primary/10 py-3 last:border-0">
      <div className="min-w-0">
        <p className="font-ui text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-text/55">{label}</p>
        <p className="break-words font-ui text-sm font-semibold text-brand-primary">{value}</p>
      </div>
      <button type="button" onClick={copy} className="flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-brand-primary/25 px-4 font-ui text-xs font-semibold text-brand-primary transition-colors hover:bg-brand-primary hover:text-brand-on-primary">
        {done ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {done ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}

const input = "h-12 w-full rounded-xl border border-brand-primary/20 bg-white/60 px-4 font-ui text-sm text-brand-text outline-none transition-colors placeholder:text-brand-text/35 focus:border-brand-primary focus:bg-white";
const labelCls = "mb-1.5 block font-ui text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-text/70";

interface Done {
  orderCode: string;
  whatsappUrl: string;
  totalUsd: number;
  totalBs: number;
  items: CartItem[];
  demo: boolean;
}

export default function CheckoutClient({ settings }: { settings: StoreSettings }) {
  const { items, subtotalUsd, rate, clear } = useCart();
  const [delivery, setDelivery] = useState<string>(DELIVERY_METHODS[0].id);
  const [pay, setPay] = useState<PaymentMethodId>("pago_movil");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done | null>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- URL derivado de un objeto externo (File)
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const totalBs = rate ? subtotalUsd * rate : null;
  const method = DELIVERY_METHODS.find((d) => d.id === delivery) ?? DELIVERY_METHODS[0];

  function onFile(f: File | undefined) {
    if (!f) return;
    if (!OK_TYPES.includes(f.type)) return setError("El comprobante debe ser JPG, PNG o WebP.");
    if (f.size > MAX) return setError("El comprobante supera los 5 MB.");
    setError("");
    setFile(f);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return setError("Adjunta la foto de tu comprobante.");
    setError("");
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    fd.set("entrega", delivery);
    fd.set("metodoPago", pay);
    fd.set("comprobante", file);
    fd.set("items", JSON.stringify(items.map(({ productId, slug, color, size, quantity, isCustom, customData }) => ({ productId, slug, color, size, quantity, isCustom, customData }))));
    try {
      const res = await fetch("/api/orders", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "No pudimos registrar tu pedido.");
      setDone({ orderCode: data.orderCode, whatsappUrl: data.whatsappUrl, totalUsd: data.totalUsd, totalBs: data.totalBs, items, demo: Boolean(data.demo) });
      clear();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="container-wide py-10 md:py-20">
        <div className="mx-auto max-w-2xl rounded-3xl border border-brand-primary/10 bg-white/50 p-6 text-center md:p-12">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-primary text-brand-on-primary"><Check className="h-8 w-8" /></span>
          <p className="mt-6 font-ui text-[11px] font-semibold uppercase tracking-[0.35em] text-brand-accent">Pedido recibido</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-brand-primary md:text-5xl">{done.orderCode}</h1>
          <p className="mx-auto mt-3 max-w-md font-ui text-sm text-brand-text/70">Verificaremos tu pago y te escribiremos por WhatsApp. Confirma tu pedido para agilizar el proceso.</p>
          {done.demo && <p className="mx-auto mt-3 max-w-md rounded-xl bg-brand-accent/20 px-4 py-2 font-ui text-xs text-brand-text">Modo demo: Supabase aún no está configurado, el pedido no se guardó.</p>}
          <ul className="mt-8 divide-y divide-brand-primary/10 text-left">
            {done.items.map((i) => (
              <li key={i.lineId} className="flex items-center gap-4 py-3">
                <CartThumb item={i} className="h-16 w-14 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base text-brand-primary">{i.name}</p>
                  <p className="font-ui text-xs text-brand-text/60">{i.quantity}× · {i.color} · {i.size}</p>
                </div>
                <p className="font-ui text-sm font-bold text-brand-primary">{usd(i.priceUsd * i.quantity)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-end justify-between border-t border-brand-primary/15 pt-4 text-left">
            <span className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-brand-text/60">Total</span>
            <div className="text-right">
              <p className="font-ui text-2xl font-bold text-brand-primary">{usd(done.totalUsd)}</p>
              <p className="font-ui text-xs text-brand-text/60">Bs. {formatBs(done.totalBs)}</p>
            </div>
          </div>
          <a href={done.whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-8 flex h-14 items-center justify-center gap-2 rounded-full bg-[#1E4D24] font-ui text-sm font-semibold uppercase tracking-[0.16em] text-[#F8F5EA] shadow-[0_12px_26px_-14px_rgba(30,77,36,0.9)] transition-transform hover:-translate-y-0.5">
            <MessageCircle className="h-5 w-5" /> Confirmar por WhatsApp
          </a>
          <Link href="/tienda" className="mt-4 inline-block font-ui text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary underline-offset-4 hover:underline">Seguir comprando</Link>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="container-wide flex flex-col items-center gap-5 py-28 text-center">
        <ShoppingBag className="h-12 w-12 text-brand-primary/30" />
        <h1 className="font-display text-3xl text-brand-primary">Tu carrito está vacío</h1>
        <Link href="/tienda" className="rounded-full bg-brand-primary px-8 py-4 font-ui text-xs font-semibold uppercase tracking-[0.16em] text-brand-on-primary">Ir a la tienda</Link>
      </div>
    );
  }

  const bsText = totalBs ? `Bs. ${formatBs(totalBs)}` : "Bs. --,--";

  return (
    <form onSubmit={submit} className="container-wide grid gap-10 py-8 md:py-14 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-16">
      <div className="space-y-10">
        <h1 className="font-display text-4xl font-semibold text-brand-primary md:text-5xl">Finalizar compra</h1>

        <section className="space-y-4">
          <h2 className="font-display text-2xl text-brand-primary">1. Tus datos</h2>
          <div>
            <label htmlFor="nombre" className={labelCls}>Nombre completo</label>
            <input id="nombre" name="nombre" required minLength={3} autoComplete="name" className={input} placeholder="María Pérez" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="whatsapp" className={labelCls}>WhatsApp</label>
              <input id="whatsapp" name="whatsapp" required type="tel" inputMode="tel" autoComplete="tel" className={input} placeholder="0412-1234567" />
            </div>
            <div>
              <label htmlFor="estadoCiudad" className={labelCls}>Estado / Ciudad</label>
              <input id="estadoCiudad" name="estadoCiudad" required className={input} placeholder="Portuguesa / Guanare" />
            </div>
          </div>
          <div>
            <p className={labelCls}>Método de entrega</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Método de entrega">
              {DELIVERY_METHODS.map((d) => (
                <button key={d.id} type="button" role="radio" aria-checked={delivery === d.id} onClick={() => setDelivery(d.id)} className={`min-h-12 rounded-xl border px-4 py-3 text-left font-ui text-sm font-semibold transition-all ${delivery === d.id ? "border-brand-primary bg-brand-primary text-brand-on-primary" : "border-brand-primary/20 text-brand-primary hover:border-brand-primary/60"}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="direccion" className={labelCls}>{method.field}</label>
            <input id="direccion" name="direccion" required={delivery !== "retiro-guanare"} className={input} placeholder={delivery === "delivery-caracas" ? "Urbanización, calle, casa/edificio" : "Referencia o nombre de la agencia"} />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl text-brand-primary">2. Método de pago</h2>
          <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Método de pago">
            {([["pago_movil", "Pago Móvil"], ["binance", "Binance Pay"], ["transferencia", "Transferencia"]] as const).map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={pay === id} onClick={() => setPay(id)} className={`min-h-12 rounded-xl border px-2 py-3 font-ui text-xs font-semibold uppercase tracking-[0.1em] transition-all md:text-sm ${pay === id ? "border-brand-primary bg-brand-primary text-brand-on-primary" : "border-brand-primary/20 text-brand-primary"}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-brand-primary/15 bg-white/50 p-5">
            {pay === "pago_movil" && (
              <>
                <CopyRow label="Banco" value={settings.pagoMovil.banco} />
                <CopyRow label="Teléfono" value={settings.pagoMovil.telefono} />
                <CopyRow label="CI / RIF" value={settings.pagoMovil.documento} />
                {totalBs && <CopyRow label="Monto exacto a transferir" value={formatBs(totalBs)} />}
              </>
            )}
            {pay === "binance" && (
              <>
                <CopyRow label="Binance ID" value={settings.binance.id} />
                <CopyRow label="Correo Binance" value={settings.binance.correo} />
                <CopyRow label="Monto exacto en USD" value={subtotalUsd.toFixed(2)} />
              </>
            )}
            {pay === "transferencia" && (
              <>
                <CopyRow label="Banco" value={settings.transferencia.banco} />
                <CopyRow label="Cuenta" value={settings.transferencia.cuenta} />
                <CopyRow label="Titular" value={settings.transferencia.titular} />
                <CopyRow label="RIF" value={settings.transferencia.rif} />
                {totalBs && <CopyRow label="Monto exacto a transferir" value={formatBs(totalBs)} />}
              </>
            )}
            <p className="mt-3 rounded-xl bg-brand-primary/5 px-4 py-3 text-center font-ui text-sm font-bold text-brand-primary">
              Monto a pagar: {pay === "binance" ? usd(subtotalUsd) : bsText}
            </p>
            {settings.source === "demo" && <p className="mt-2 text-center font-ui text-[11px] text-brand-text/50">Datos de ejemplo — se reemplazan desde la configuración de la tienda.</p>}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl text-brand-primary">3. Comprobante</h2>
          <div>
            <label htmlFor="referencia" className={labelCls}>Número de referencia</label>
            <input id="referencia" name="referencia" required minLength={4} inputMode="numeric" className={input} placeholder="Ej. 00123456" />
          </div>
          <div>
            <p className={labelCls}>Foto del comprobante (JPG, PNG o WebP · máx. 5 MB)</p>
            <label htmlFor="comprobante" className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-brand-primary/30 bg-white/40 p-4 text-center transition-colors hover:border-brand-primary">
              {file && preview ? (
                // eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:)
                <img src={preview} alt="Vista previa del comprobante" className="max-h-72 rounded-lg object-contain" />
              ) : (
                <>
                  <ImagePlus className="h-8 w-8 text-brand-primary/50" />
                  <span className="font-ui text-sm text-brand-text/70">Toca para subir tu comprobante</span>
                </>
              )}
              {file && <span className="font-ui text-xs text-brand-text/60">{file.name} · toca para cambiar</span>}
            </label>
            <input id="comprobante" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          </div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-36 lg:self-start">
        <div className="rounded-3xl border border-brand-primary/10 bg-white/50 p-5 md:p-7">
          <h2 className="font-display text-2xl text-brand-primary">Resumen</h2>
          <ul className="mt-4 divide-y divide-brand-primary/10">
            {items.map((i) => (
              <li key={i.lineId} className="flex items-center gap-4 py-3">
                <CartThumb item={i} className="h-20 w-16 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base leading-tight text-brand-primary">{i.name}</p>
                  <p className="font-ui text-xs text-brand-text/60">{i.quantity}× · {i.color} · {i.size}</p>
                </div>
                <div className="text-right">
                  <p className="font-ui text-sm font-bold text-brand-primary">{usd(i.priceUsd * i.quantity)}</p>
                  {rate && <p className="font-ui text-[11px] text-brand-text/55">Bs. {formatBs(i.priceUsd * i.quantity * rate)}</p>}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-end justify-between border-t border-brand-primary/15 pt-4">
            <span className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-brand-text/60">Total</span>
            <div className="text-right">
              <p className="font-ui text-3xl font-bold text-brand-primary">{usd(subtotalUsd)}</p>
              <p className="font-ui text-sm text-brand-text/65">{bsText} · BCV</p>
            </div>
          </div>
          <p className="mt-2 font-ui text-[11px] text-brand-text/50">El costo de envío se coordina por WhatsApp según el método elegido.</p>
          {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 font-ui text-sm font-semibold text-red-700">{error}</p>}
          <button type="submit" disabled={busy || !rate} className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#1E4D24] font-ui text-sm font-semibold uppercase tracking-[0.16em] text-[#F8F5EA] shadow-[0_12px_26px_-14px_rgba(30,77,36,0.9)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</> : "Enviar pedido"}
          </button>
          {!rate && <p className="mt-2 text-center font-ui text-[11px] text-brand-text/50">Esperando la tasa BCV…</p>}
        </div>
      </aside>
    </form>
  );
}
