"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Boxes, ClipboardList, Image as ImageIcon, Layers, Loader2, LogOut, Palette, Sparkles } from "lucide-react";
import { getTheme } from "@/lib/themes";
import BrandTab from "./BrandTab";
import EntityManager, { type FieldDef } from "./EntityManager";
import LeadsTab from "./LeadsTab";
import OrdersTab from "./OrdersTab";
import StockMatrix from "./StockMatrix";
import { Btn, Field, SectionTitle, api, inputCls, postJson, str, type Row } from "./ui";

interface AdminData {
  store_settings: Row | null;
  departments: Row[];
  product_formats: Row[];
  blank_stock: Row[];
  products: Row[];
  hero_slides: Row[];
  custom_templates: Row[];
  orders: Row[];
  ai_leads: Row[];
  meta: { demoPassword: boolean; demoData: boolean };
}

const TABS = [
  { id: "orders", label: "Pedidos", icon: ClipboardList },
  { id: "brand", label: "Marca y Contacto", icon: Palette },
  { id: "structure", label: "Departamentos", icon: Layers },
  { id: "catalog", label: "Catálogo y Stock", icon: Boxes },
  { id: "hero", label: "Hero y Plantillas", icon: ImageIcon },
  { id: "leads", label: "Leads IA", icon: Sparkles },
] as const;
type TabId = (typeof TABS)[number]["id"];

const DEPT_FIELDS: FieldDef[] = [
  { key: "nombre", label: "Nombre", type: "text" },
  { key: "slug", label: "Slug (URL)", type: "text" },
  { key: "subtitulo", label: "Subtítulo", type: "text", wide: true },
  { key: "orden", label: "Orden", type: "number" },
  { key: "activo", label: "Activo", type: "bool" },
];
const FORMAT_FIELDS: FieldDef[] = [
  { key: "nombre", label: "Nombre", type: "text" },
  { key: "slug", label: "Slug (URL)", type: "text" },
  { key: "display_mode", label: "Exhibición", type: "select", options: [{ value: "rack", label: "Perchero (rack)" }, { value: "shelf", label: "Repisa (shelf)" }] },
  { key: "orden", label: "Orden", type: "number" },
  { key: "activo", label: "Activo", type: "bool" },
];
const MODES = ["gema", "torre", "editorial", "libre"].map((m) => ({ value: m, label: m }));
const bytype = (t: "image" | "video") => ({ value: t, label: t === "image" ? "Imagen" : "Video" });

export default function AdminDashboard() {
  const [status, setStatus] = useState<"checking" | "login" | "ready">("checking");
  const [diag, setDiag] = useState<{ demo: boolean; len: number } | null>(null);
  const [data, setData] = useState<AdminData | null>(null);
  const [tab, setTab] = useState<TabId>("orders");
  const [toast, setToast] = useState<{ msg: string; err: boolean } | null>(null);
  const [theme, setTheme] = useState("so-guau");

  const notify = (msg: string, err = false) => {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 3500);
  };

  function applyData(d: AdminData) {
    setData(d);
    setTheme(str(d.store_settings?.theme_key) || "so-guau");
    setStatus("ready");
  }

  async function reload(): Promise<string | null> {
    const r = await api<AdminData>("/api/admin/data");
    if (r.status === 401) { setStatus("login"); return `${r.data.error ?? "No autorizado"} (${r.data.reason ?? "401"})`; }
    if (!r.ok) { notify(r.data.error ?? "No se pudieron cargar los datos", true); return r.data.error ?? `Error HTTP ${r.status}`; }
    applyData(r.data);
    return null;
  }

  useEffect(() => {
    let alive = true;
    api<{ authenticated: boolean; envPasswordConfigured?: boolean; envPasswordLength?: number }>("/api/admin/auth").then(async (a) => {
      if (!alive) return;
      setDiag({ demo: !a.data.envPasswordConfigured, len: a.data.envPasswordLength ?? 0 });
      if (!a.data.authenticated) return setStatus("login");
      const r = await api<AdminData>("/api/admin/data");
      if (!alive) return;
      if (r.ok) applyData(r.data);
      else setStatus("login");
    });
    return () => { alive = false; };
  }, []);

  async function save(table: string, values: Row) {
    const id = typeof values.id === "string" && !values.id.startsWith("demo") ? values.id : undefined;
    const r = await postJson("/api/admin/crud", { table, action: "upsert", values: id ? values : { ...values, id: undefined } });
    if (!r.ok) { notify(r.data.error ?? "No se pudo guardar", true); return false; }
    notify("Guardado");
    await reload();
    return true;
  }
  async function remove(table: string, id: string) {
    const r = await postJson("/api/admin/crud", { table, action: "delete", id });
    if (!r.ok) { notify(r.data.error ?? "No se pudo eliminar", true); return false; }
    notify("Eliminado");
    await reload();
    return true;
  }
  async function patch(table: string, id: string, values: Row, silent = false) {
    const r = await postJson("/api/admin/crud", { table, action: "update", id, values });
    if (!r.ok) { notify(r.data.error ?? "No se pudo actualizar", true); return false; }
    if (!silent) notify("Actualizado");
    await reload();
    return true;
  }
  async function logout() {
    await api("/api/admin/auth", { method: "DELETE" });
    setData(null);
    setStatus("login");
  }

  const wrap = (children: React.ReactNode) => (
    <div data-theme={theme} className="min-h-screen bg-brand-bg text-brand-text">{children}</div>
  );

  if (status === "checking") {
    return wrap(<div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-brand-primary" /></div>);
  }

  if (status === "login" || !data) {
    return wrap(<Login diag={diag} onDone={reload} />);
  }

  const d = data;
  const brand = str(d.store_settings?.nombre) || "So Guau";
  const logo = str(d.store_settings?.logo_url);
  const pending = d.orders.filter((o) => o.estado === "por_verificar").length;
  const deptOpts = [{ value: "", label: "— Sin departamento —" }, ...d.departments.map((x) => ({ value: str(x.id), label: str(x.nombre) }))];
  const fmtOpts = [{ value: "", label: "— Sin formato —" }, ...d.product_formats.map((x) => ({ value: str(x.id), label: str(x.nombre) }))];

  const productFields: FieldDef[] = [
    { key: "nombre", label: "Nombre", type: "text" },
    { key: "precio_usd", label: "Precio USD", type: "number" },
    { key: "department_id", label: "Departamento", type: "select", options: deptOpts },
    { key: "format_id", label: "Formato", type: "select", options: fmtOpts },
    { key: "badge", label: "Badge", type: "text", hint: "Ej: Nuevo, Más vendido" },
    { key: "colores_json", label: "Colores", type: "colors", hint: "Formato: Nombre=#hex, separados por coma" },
    { key: "foto_perfil_url", label: "Foto Perfil (Perchero cerrado — opcional)", type: "media", folder: "productos", hint: "PNG sin fondo, vertical 2:3" },
    { key: "foto_frente_url", label: "Foto Frente (Perchero abierto)", type: "media", folder: "productos", hint: "PNG sin fondo, vertical 2:3" },
    { key: "foto_espalda_url", label: "Foto Espalda (Vista trasera — opcional)", type: "media", folder: "productos", hint: "PNG sin fondo, vertical 2:3" },
    { key: "es_personalizable", label: "Es personalizable", type: "bool" },
    { key: "activo", label: "Activo", type: "bool" },
  ];
  const slideFields: FieldDef[] = [
    { key: "media_type", label: "Tipo", type: "select", options: [bytype("image"), bytype("video")] },
    { key: "orden", label: "Orden", type: "number" },
    { key: "media_url", label: "Imagen / video", type: "media", folder: "hero", accept: "image/*,video/mp4,video/webm", wide: true },
    { key: "titulo", label: "Título", type: "text" },
    { key: "subtitulo", label: "Subtítulo", type: "text" },
    { key: "cta_texto", label: "Texto del botón (CTA)", type: "text" },
    { key: "cta_link", label: "Enlace del botón", type: "text", hint: "/tienda" },
    { key: "activo", label: "Activo", type: "bool" },
  ];
  const templateFields: FieldDef[] = [
    { key: "nombre", label: "Nombre", type: "text" },
    { key: "slug", label: "Slug", type: "text" },
    { key: "modo", label: "Modo", type: "select", options: MODES },
    { key: "max_fotos", label: "Máx. fotos", type: "number" },
    { key: "descripcion", label: "Descripción corta", type: "text", wide: true },
    { key: "imagen_referencia_url", label: "Imagen de referencia", type: "media", folder: "plantillas" },
    { key: "prompt_sistema", label: "Prompt de sistema", type: "textarea" },
    { key: "activo", label: "Activo", type: "bool" },
  ];

  const common = { onSave: save, onDelete: remove, onError: (m: string) => notify(m, true) };

  return wrap(
    <>
      <header className="sticky top-0 z-30 border-b border-brand-text/10 bg-brand-bg/95 backdrop-blur">
        <div className="container-wide flex items-center justify-between gap-3 py-3">
          <div className="flex min-w-0 items-center gap-3">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="h-9 w-9 rounded-lg object-cover" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary font-display text-lg text-brand-on-primary">{brand.charAt(0)}</span>
            )}
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-semibold leading-tight">{brand}</p>
              <p className="text-xs text-brand-text/60">Panel administrativo</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${d.meta.demoData ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
              <span aria-hidden className={`mr-1.5 inline-block h-2 w-2 rounded-full ${d.meta.demoData ? "bg-red-600" : "bg-green-600"}`} />
              {d.meta.demoData ? "Modo Demo (faltan claves en Vercel)" : "Supabase Conectado"}
            </span>
            <Btn variant="ghost" onClick={logout}><LogOut size={16} /> <span className="hidden sm:inline">Salir</span></Btn>
          </div>
        </div>
        {(d.meta.demoPassword || d.meta.demoData) && (
          <p className="container-wide pb-2 text-xs text-brand-text/50">
            {d.meta.demoPassword && "Modo demo: contraseña por defecto activa (define ADMIN_PASSWORD). "}
            {d.meta.demoData && "Los cambios no se guardan hasta conectar Supabase."}
          </p>
        )}
      </header>

      <div className="container-wide grid gap-6 py-6 pb-28 lg:grid-cols-[15rem_1fr] lg:pb-10">
        <nav className="hidden self-start lg:sticky lg:top-24 lg:block" aria-label="Secciones">
          <ul className="space-y-1">
            {TABS.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => setTab(t.id)}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${tab === t.id ? "bg-brand-primary text-brand-on-primary" : "hover:bg-brand-text/5"}`}
                >
                  <t.icon size={18} /> {t.label}
                  {t.id === "orders" && pending > 0 && <span className="ml-auto rounded-full bg-brand-accent px-2 py-0.5 text-xs text-brand-text">{pending}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0">
          {tab === "orders" && <OrdersTab orders={d.orders} onState={(id, estado) => patch("orders", id, { estado })} onError={(m) => notify(m, true)} />}

          {tab === "brand" && (
            <BrandTab key={str(d.store_settings?.id)} settings={d.store_settings} onSave={(v) => save("store_settings", v)} onError={(m) => notify(m, true)} onTheme={setTheme} />
          )}

          {tab === "structure" && (
            <div className="space-y-10">
              <section>
                <SectionTitle title="Departamentos" sub="Temas del catálogo (Frenchies, Gatos…)" />
                <EntityManager table="departments" rows={d.departments} fields={DEPT_FIELDS} titleKey="nombre" newLabel="Nuevo departamento" defaults={{ nombre: "", slug: "", subtitulo: "", orden: d.departments.length + 1, activo: true }} {...common} />
              </section>
              <section>
                <SectionTitle title="Formatos de producto" sub="Perchero (rack) para prendas, repisa (shelf) para objetos" />
                <EntityManager table="product_formats" rows={d.product_formats} fields={FORMAT_FIELDS} titleKey="nombre" newLabel="Nuevo formato" defaults={{ nombre: "", slug: "", display_mode: "rack", orden: d.product_formats.length + 1, activo: true }} {...common} />
              </section>
            </div>
          )}

          {tab === "catalog" && (
            <div className="space-y-10">
              <section>
                <SectionTitle title="Stock de Prendas Lisas" sub="Apaga o enciende la disponibilidad por formato, color y talla" />
                <StockMatrix
                  formats={d.product_formats} stock={d.blank_stock}
                  onToggle={(id, v) => patch("blank_stock", id, { in_stock: v }, true)}
                  onAdd={(v) => save("blank_stock", v)}
                />
              </section>
              <section>
                <SectionTitle title="Productos" sub="Catálogo de la tienda" />
                <EntityManager table="products" rows={d.products} fields={productFields} titleKey="nombre" newLabel="Nuevo producto" defaults={{ nombre: "", precio_usd: 0, department_id: "", format_id: "", badge: "", colores_json: [], es_personalizable: false, activo: true }} {...common} />
              </section>
            </div>
          )}

          {tab === "hero" && (
            <div className="space-y-10">
              <section>
                <SectionTitle title="Slides del Hero" sub="Imagen o video de portada" />
                <EntityManager table="hero_slides" rows={d.hero_slides} fields={slideFields} titleKey="titulo" newLabel="Nuevo slide" defaults={{ media_type: "image", media_url: "", titulo: "", subtitulo: "", cta_texto: "", cta_link: "/tienda", orden: d.hero_slides.length + 1, activo: true }} {...common} />
              </section>
              <section>
                <SectionTitle title="Plantillas IA" sub="Estilos del personalizador" />
                <EntityManager table="custom_templates" rows={d.custom_templates} fields={templateFields} titleKey="nombre" newLabel="Nueva plantilla" defaults={{ nombre: "", slug: "", modo: "libre", descripcion: "", prompt_sistema: "", max_fotos: 1, activo: true }} {...common} />
              </section>
            </div>
          )}

          {tab === "leads" && <LeadsTab leads={d.ai_leads} />}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-text/10 bg-brand-bg/95 backdrop-blur lg:hidden" aria-label="Secciones">
        <ul className="flex">
          {TABS.map((t) => (
            <li key={t.id} className="flex-1">
              <button
                onClick={() => { setTab(t.id); window.scrollTo({ top: 0 }); }}
                aria-label={t.label}
                className={`relative flex min-h-14 w-full cursor-pointer flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${tab === t.id ? "text-brand-primary" : "text-brand-text/55"}`}
              >
                <t.icon size={20} />
                <span className="max-w-full truncate px-0.5">{t.label.split(" ")[0]}</span>
                {t.id === "orders" && pending > 0 && <span className="absolute right-3 top-1.5 h-2.5 w-2.5 rounded-full bg-brand-accent" />}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {toast && (
        <div role="status" className={`fixed bottom-20 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-medium shadow-lg lg:bottom-6 ${toast.err ? "bg-red-600 text-white" : "bg-brand-primary text-brand-on-primary"}`}>
          {toast.msg}
        </div>
      )}
    </>,
  );
}

function Login({ diag, onDone }: { diag: { demo: boolean; len: number } | null; onDone: () => Promise<string | null> }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const brand = getTheme("so-guau").name;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await postJson("/api/admin/auth", { password });
    if (r.ok) {
      const fail = await onDone();
      if (fail) setError(`Sesión creada pero no se cargaron los datos: ${fail}`);
    } else {
      setError(`${r.data.error ?? `No se pudo iniciar sesión (HTTP ${r.status})`}${r.data.reason ? ` [${r.data.reason}]` : ""}`);
    }
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-brand-text/10 bg-white/70 p-8 shadow-xl">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary font-display text-2xl text-brand-on-primary">S</span>
        <h1 className="text-center font-display text-3xl font-semibold">{brand}</h1>
        <p className="mb-6 text-center text-sm text-brand-text/60">Panel administrativo</p>
        <Field label="Contraseña">
          <input className={inputCls} type="password" autoFocus autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        <Btn type="submit" busy={busy} className="mt-5 w-full">Entrar</Btn>
        <p className="mt-4 text-center text-xs text-brand-text/45">{diag === null ? "Servidor: comprobando…" : diag.demo ? "Servidor: sin ADMIN_PASSWORD, modo demo" : `Servidor: clave activa (${diag.len} caracteres)`}</p>
      </form>
    </div>
  );
}
