"use client";

import { useState } from "react";
import { Download, MessageCircle, Receipt } from "lucide-react";
import { Btn, Card, SectionTitle, digits, postJson, str, type Row } from "./ui";

const STATES = [
  { id: "por_verificar", label: "Por verificar" },
  { id: "confirmado", label: "Confirmado" },
  { id: "en_taller", label: "En taller" },
  { id: "enviado", label: "Enviado" },
];

const stateTone: Record<string, string> = {
  por_verificar: "bg-amber-100 text-amber-900",
  confirmado: "bg-sky-100 text-sky-900",
  en_taller: "bg-violet-100 text-violet-900",
  enviado: "bg-emerald-100 text-emerald-900",
};

interface Item {
  name?: string; color?: string; size?: string; quantity?: number; isCustom?: boolean;
  customData?: { templateName?: string; petName?: string; originalFileUrl?: string; originalPaths?: string[]; position?: string };
}

export default function OrdersTab({
  orders, onState, onError,
}: { orders: Row[]; onState: (id: string, estado: string) => Promise<boolean>; onError: (m: string) => void }) {
  const [filter, setFilter] = useState("todos");
  const [busyId, setBusyId] = useState("");
  const list = filter === "todos" ? orders : orders.filter((o) => o.estado === filter);

  async function openPrivate(bucket: string, path: string) {
    if (!path) return onError("Este pedido no tiene archivo asociado");
    const win = window.open("", "_blank");
    const r = await postJson("/api/admin/signed-url", { bucket, path });
    const url = (r.data as { url?: string }).url;
    if (r.ok && url) {
      if (win) win.location.replace(url);
      else window.open(url, "_blank", "noopener");
    } else {
      win?.close();
      onError(r.data.error ?? "No se pudo generar el enlace");
    }
  }

  async function change(id: string, estado: string) {
    setBusyId(id);
    await onState(id, estado);
    setBusyId("");
  }

  return (
    <div>
      <SectionTitle title="Cola de Taller DTF" sub={`${orders.length} pedidos · más recientes primero`} />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[{ id: "todos", label: "Todos" }, ...STATES].map((s) => {
          const n = s.id === "todos" ? orders.length : orders.filter((o) => o.estado === s.id).length;
          return (
            <button
              key={s.id} onClick={() => setFilter(s.id)}
              className={`shrink-0 cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition ${filter === s.id ? "border-brand-primary bg-brand-primary text-brand-on-primary" : "border-brand-text/20 hover:bg-brand-text/5"}`}
            >
              {s.label} <span className="opacity-70">({n})</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {list.map((o) => {
          const id = str(o.id);
          const items = (Array.isArray(o.items_json) ? o.items_json : []) as Item[];
          const wa = digits(o.cliente_whatsapp);
          const total = Number(o.total_usd) || 0;
          const bs = Number(o.total_bs) || 0;
          return (
            <Card key={id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-display text-xl font-semibold">{str(o.codigo) || "SG-????"}</p>
                  <p className="text-xs text-brand-text/60">{o.created_at ? new Date(str(o.created_at)).toLocaleString("es-VE") : ""}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${stateTone[str(o.estado)] ?? ""}`}>
                  {STATES.find((s) => s.id === o.estado)?.label ?? str(o.estado)}
                </span>
              </div>

              <div className="mt-3 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                <p><span className="text-brand-text/60">Cliente:</span> <strong>{str(o.cliente_nombre)}</strong></p>
                <p><span className="text-brand-text/60">Pago:</span> {str(o.metodo_pago) || "—"}</p>
                <p><span className="text-brand-text/60">Referencia:</span> {str(o.referencia) || "—"}</p>
                <p><span className="text-brand-text/60">Entrega:</span> {str(o.metodo_entrega) || "—"} {str(o.ciudad_estado)}</p>
                <p className="font-semibold">${total.toFixed(2)} USD <span className="font-normal text-brand-text/60">· Bs. {bs.toLocaleString("es-VE", { minimumFractionDigits: 2 })}</span></p>
              </div>

              <ul className="mt-3 space-y-2 border-t border-brand-text/10 pt-3 text-sm">
                {items.map((it, i) => (
                  <li key={i}>
                    <p>{it.quantity}× {it.name} <span className="text-brand-text/60">({it.color}, {it.size})</span></p>
                    {it.isCustom && it.customData && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 rounded-lg bg-brand-accent/25 p-2">
                        <span className="text-xs font-medium">
                          Personalizado · {it.customData.templateName}{it.customData.petName ? ` · ${it.customData.petName}` : ""}{it.customData.position ? ` · ${it.customData.position}` : ""}
                        </span>
                        <Btn variant="ghost" className="!min-h-9 !py-1.5" onClick={() => openPrivate("artes-personalizados", str(it.customData?.originalFileUrl))}>
                          <Download size={14} /> Descargar Arte Limpio
                        </Btn>
                        {(it.customData.originalPaths ?? []).filter(Boolean).map((p, n) => (
                          <Btn key={p} variant="ghost" className="!min-h-9 !py-1.5" onClick={() => openPrivate("artes-personalizados", p)}>
                            <Download size={14} /> Foto {n + 1}
                          </Btn>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              <div className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {STATES.map((s) => (
                  <button
                    key={s.id} disabled={busyId === id} onClick={() => o.estado !== s.id && change(id, s.id)}
                    className={`min-h-11 cursor-pointer rounded-lg border px-2 text-xs font-semibold transition disabled:opacity-50 ${o.estado === s.id ? "border-brand-primary bg-brand-primary text-brand-on-primary" : "border-brand-text/20 hover:bg-brand-text/5"}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Btn variant="ghost" onClick={() => openPrivate("comprobantes", str(o.comprobante_url))}><Receipt size={16} /> Ver comprobante</Btn>
                {wa && (
                  <Btn variant="accent" href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hola ${str(o.cliente_nombre)}, te escribimos de So Guau por tu pedido ${str(o.codigo)} 🐾`)}`}>
                    <MessageCircle size={16} /> WhatsApp
                  </Btn>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      {!list.length && <p className="py-10 text-center text-sm text-brand-text/50">No hay pedidos en esta vista.</p>}
    </div>
  );
}
