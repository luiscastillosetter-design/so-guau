"use client";

import { useState } from "react";
import { Check, Save } from "lucide-react";
import { THEMES, type ThemeKey } from "@/lib/themes";
import { Btn, Card, Field, MediaUpload, SectionTitle, inputCls, str, type Row } from "./ui";

const obj = (v: unknown): Row => (v && typeof v === "object" ? (v as Row) : {});

export default function BrandTab({
  settings, onSave, onError, onTheme,
}: { settings: Row | null; onSave: (values: Row) => Promise<boolean>; onError: (m: string) => void; onTheme: (k: string) => void }) {
  const s = settings ?? {};
  const [f, setF] = useState({
    nombre: str(s.nombre), eslogan: str(s.eslogan), dominio: str(s.dominio), logo_url: str(s.logo_url),
    theme_key: str(s.theme_key) || "so-guau", whatsapp: str(s.whatsapp), prompt_bot: str(s.prompt_bot),
    email: str(s.email), telefono: str(s.telefono), direccion: str(s.direccion), horario: str(s.horario),
    instagram_url: str(s.instagram_url), tiktok_url: str(s.tiktok_url), facebook_url: str(s.facebook_url), footer_descripcion: str(s.footer_descripcion),
    pm_banco: str(obj(s.pago_movil).banco), pm_telefono: str(obj(s.pago_movil).telefono), pm_cedula: str(obj(s.pago_movil).cedula ?? obj(s.pago_movil).documento),
    bn_id: str(obj(s.binance).id), bn_correo: str(obj(s.binance).correo),
    tr_banco: str(obj(s.transferencia).banco), tr_cuenta: str(obj(s.transferencia).cuenta), tr_titular: str(obj(s.transferencia).titular), tr_rif: str(obj(s.transferencia).rif),
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const text = (k: keyof typeof f, label: string, placeholder = "") => (
    <Field label={label}><input className={inputCls} value={f[k]} placeholder={placeholder} onChange={(e) => set(k, e.target.value)} /></Field>
  );

  async function save() {
    setBusy(true);
    await onSave({
      ...(s.id && !String(s.id).startsWith("demo") ? { id: s.id } : {}),
      nombre: f.nombre.trim() || "So Guau", eslogan: f.eslogan.trim(), dominio: f.dominio.trim() || "https://soguau.com",
      logo_url: f.logo_url || null, theme_key: f.theme_key, whatsapp: f.whatsapp.replace(/\D/g, ""), prompt_bot: f.prompt_bot,
      email: f.email.trim() || null, telefono: f.telefono.trim() || null, direccion: f.direccion.trim() || null, horario: f.horario.trim() || null,
      instagram_url: f.instagram_url.trim() || null, tiktok_url: f.tiktok_url.trim() || null, facebook_url: f.facebook_url.trim() || null,
      footer_descripcion: f.footer_descripcion.trim() || null,
      pago_movil: { banco: f.pm_banco, telefono: f.pm_telefono, cedula: f.pm_cedula },
      binance: { id: f.bn_id, correo: f.bn_correo },
      transferencia: { banco: f.tr_banco, cuenta: f.tr_cuenta, titular: f.tr_titular, rif: f.tr_rif },
    });
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <SectionTitle title="Marca y Contacto" sub="Logo, contacto, redes, footer, tema de color y pagos" action={<Btn onClick={save} busy={busy}><Save size={16} /> Guardar cambios</Btn>} />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-semibold">Identidad</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {text("nombre", "Nombre de marca")}
            {text("eslogan", "Eslogan")}
            {text("dominio", "Dominio", "https://soguau.com")}
            {text("whatsapp", "WhatsApp (con código país)", "584120000000")}
            {text("email", "Correo electrónico", "hola@soguau.com")}
            {text("telefono", "Teléfono", "+58 212 000 0000")}
            {text("direccion", "Dirección / Ciudad", "Caracas, Venezuela")}
            {text("horario", "Horario de atención", "Lun–Sáb 9:00–18:00")}
            {text("instagram_url", "Instagram (URL)", "https://instagram.com/soguau")}
            {text("tiktok_url", "TikTok (URL)", "https://tiktok.com/@soguau")}
            {text("facebook_url", "Facebook (URL)", "https://facebook.com/soguau")}
            <div className="sm:col-span-2"><Field label="Descripción del footer"><textarea className={`${inputCls} min-h-20`} value={f.footer_descripcion} onChange={(e) => set("footer_descripcion", e.target.value)} /></Field></div>
            <div className="sm:col-span-2"><Field label="Logo"><MediaUpload value={f.logo_url} onChange={(u) => set("logo_url", u)} folder="logo" onError={onError} /></Field></div>
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 font-semibold">Tema de color</h3>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(THEMES) as ThemeKey[]).map((k) => {
              const t = THEMES[k];
              const on = f.theme_key === k;
              return (
                <button
                  key={k} type="button" onClick={() => { set("theme_key", k); onTheme(k); }}
                  className={`relative cursor-pointer rounded-xl border-2 p-3 text-left transition ${on ? "border-brand-primary" : "border-brand-text/10 hover:border-brand-text/30"}`}
                  style={{ background: t.background, color: t.text }}
                >
                  <div className="mb-2 flex gap-1.5">
                    {[t.primary, t.accent, t.text].map((c) => <span key={c} className="h-6 w-6 rounded-full border border-black/10" style={{ background: c }} />)}
                  </div>
                  <span className="text-sm font-semibold">{t.name}</span>
                  {on && <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-brand-on-primary"><Check size={12} /></span>}
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 font-semibold">Pago Móvil</h3>
          <div className="grid gap-3 sm:grid-cols-3">{text("pm_banco", "Banco")}{text("pm_telefono", "Teléfono")}{text("pm_cedula", "Cédula / RIF")}</div>
          <h3 className="mb-3 mt-5 font-semibold">Binance Pay</h3>
          <div className="grid gap-3 sm:grid-cols-2">{text("bn_id", "Binance ID")}{text("bn_correo", "Correo")}</div>
        </Card>

        <Card>
          <h3 className="mb-3 font-semibold">Transferencia bancaria</h3>
          <div className="grid gap-3 sm:grid-cols-2">{text("tr_banco", "Banco")}{text("tr_cuenta", "Número de cuenta")}{text("tr_titular", "Titular")}{text("tr_rif", "RIF")}</div>
        </Card>

        <Card className="xl:col-span-2">
          <Field label="Prompt base del asistente IA">
            <textarea className={`${inputCls} min-h-32`} value={f.prompt_bot} onChange={(e) => set("prompt_bot", e.target.value)} />
          </Field>
        </Card>
      </div>
    </div>
  );
}
