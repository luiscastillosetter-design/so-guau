"use client";

import { useRef, useState, type ReactNode } from "react";
import { Loader2, Upload } from "lucide-react";

export type Row = Record<string, unknown> & { id?: string };

export async function api<T = Record<string, unknown>>(url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T & { error?: string; reason?: string } }> {
  try {
    const res = await fetch(url, { ...init, credentials: "include", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: "Sin conexión con el servidor" } as T & { error?: string } };
  }
}

export const postJson = (url: string, body: unknown) =>
  api(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
export const digits = (v: unknown) => str(v).replace(/\D/g, "");

export const inputCls =
  "w-full rounded-lg border border-brand-text/20 bg-white/70 px-3 py-2.5 text-sm text-brand-text outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 placeholder:text-brand-text/40";

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-brand-text/60">{label}</span>
      {children}
      {hint && <span className="text-xs text-brand-text/50">{hint}</span>}
    </label>
  );
}

export function Btn({
  children, onClick, variant = "primary", busy, disabled, type = "button", href, className = "",
}: {
  children: ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "danger" | "accent"; busy?: boolean;
  disabled?: boolean; type?: "button" | "submit"; href?: string; className?: string;
}) {
  const styles = {
    primary: "bg-brand-primary text-brand-on-primary hover:opacity-90",
    accent: "bg-brand-accent text-brand-text hover:opacity-90",
    ghost: "border border-brand-text/20 text-brand-text hover:bg-brand-text/5",
    danger: "border border-red-300 text-red-700 hover:bg-red-50",
  }[variant];
  const cls = `inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`;
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{children}</a>;
  return (
    <button type={type} onClick={onClick} disabled={disabled || busy} className={cls}>
      {busy && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition disabled:opacity-50 ${checked ? "bg-brand-primary" : "bg-brand-text/25"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-brand-text/10 bg-white/60 p-4 shadow-sm md:p-5 ${className}`}>{children}</section>;
}

export function SectionTitle({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-2xl font-semibold text-brand-text">{title}</h2>
        {sub && <p className="text-sm text-brand-text/60">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function MediaUpload({
  value, onChange, folder, accept = "image/*", onError,
}: { value: string; onChange: (url: string) => void; folder: string; accept?: string; onError: (m: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const isVideo = /\.(mp4|webm)(\?|$)/i.test(value);

  async function pick(file?: File) {
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("folder", folder);
    const r = await api<{ url?: string }>("/api/admin/upload", { method: "POST", body: fd });
    setBusy(false);
    if (r.ok && r.data.url) onChange(r.data.url);
    else onError(r.data.error ?? "No se pudo subir el archivo");
    if (ref.current) ref.current.value = "";
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-brand-text/15 bg-brand-text/5">
        {value ? (
          isVideo ? <video src={value} className="h-full w-full object-cover" muted /> : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          )
        ) : <Upload size={18} className="text-brand-text/40" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        <Btn variant="ghost" busy={busy} onClick={() => ref.current?.click()} className="!min-h-9 !py-1.5">
          <Upload size={14} /> {value ? "Cambiar" : "Subir"}
        </Btn>
        {value && <button type="button" onClick={() => onChange("")} className="cursor-pointer text-left text-xs text-brand-text/50 underline">Quitar</button>}
      </div>
    </div>
  );
}
