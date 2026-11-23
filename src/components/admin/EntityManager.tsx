"use client";

import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { Btn, Card, Field, MediaUpload, Toggle, inputCls, str, type Row } from "./ui";

export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "bool" | "textarea" | "media" | "colors";
  options?: { value: string; label: string }[];
  folder?: string;
  accept?: string;
  hint?: string;
  wide?: boolean;
}

const colorsToText = (v: unknown) =>
  Array.isArray(v) ? v.map((c) => `${(c as Row).name ?? ""}=${(c as Row).hex ?? ""}`).join(", ") : "";
const textToColors = (t: string) =>
  t.split(",").map((p) => p.trim()).filter(Boolean).map((p) => {
    const [name, hex] = p.split("=").map((x) => x.trim());
    return { name, hex: hex || "#cccccc" };
  });

export default function EntityManager({
  table, rows, fields, titleKey, defaults, newLabel, onSave, onDelete, onError,
}: {
  table: string;
  rows: Row[];
  fields: FieldDef[];
  titleKey: string;
  defaults: Row;
  newLabel: string;
  onSave: (table: string, values: Row) => Promise<boolean>;
  onDelete: (table: string, id: string) => Promise<boolean>;
  onError: (m: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="space-y-3">
      <Btn onClick={() => setAdding((v) => !v)} variant={adding ? "ghost" : "primary"}>
        <Plus size={16} /> {adding ? "Cancelar" : newLabel}
      </Btn>
      {adding && (
        <EntityForm
          key="new" table={table} initial={defaults} fields={fields} isNew title={newLabel}
          onSave={async (v) => { const ok = await onSave(table, v); if (ok) setAdding(false); return ok; }}
          onDelete={async () => false} onError={onError}
        />
      )}
      <div className="grid gap-3 xl:grid-cols-2">
        {rows.map((r) => (
          <EntityForm
            key={str(r.id)} table={table} initial={r} fields={fields} title={str(r[titleKey]) || "Sin nombre"}
            onSave={(v) => onSave(table, v)} onDelete={() => onDelete(table, str(r.id))} onError={onError}
          />
        ))}
      </div>
      {!rows.length && !adding && <p className="py-6 text-center text-sm text-brand-text/50">Aún no hay registros.</p>}
    </div>
  );
}

function EntityForm({
  initial, fields, title, isNew, onSave, onDelete, onError,
}: {
  table: string; initial: Row; fields: FieldDef[]; title: string; isNew?: boolean;
  onSave: (v: Row) => Promise<boolean>; onDelete: () => Promise<boolean>; onError: (m: string) => void;
}) {
  const [draft, setDraft] = useState<Row>(() => ({
    ...initial,
    ...Object.fromEntries(fields.filter((f) => f.type === "colors").map((f) => [f.key, colorsToText(initial[f.key])])),
  }));
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: unknown) => setDraft((d) => ({ ...d, [k]: v }));

  async function save() {
    setBusy(true);
    const values: Row = { ...draft };
    for (const f of fields) {
      if (f.type === "colors") values[f.key] = textToColors(str(draft[f.key]));
      if (f.type === "number") values[f.key] = Number(draft[f.key]) || 0;
      if (f.type === "text" || f.type === "textarea" || f.type === "media" || f.type === "select") {
        const v = str(draft[f.key]).trim();
        values[f.key] = v === "" && (f.key.endsWith("_id") || f.type === "media" || f.key === "badge") ? null : v;
      }
    }
    await onSave(values);
    setBusy(false);
  }

  async function remove() {
    if (!window.confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    await onDelete();
    setBusy(false);
  }

  return (
    <Card className={isNew ? "border-brand-primary/40" : ""}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="truncate font-semibold text-brand-text">{isNew ? "Nuevo registro" : title}</h3>
        {"activo" in initial || fields.some((f) => f.key === "activo") ? (
          <div className="flex items-center gap-2 text-xs text-brand-text/60">
            Activo <Toggle checked={Boolean(draft.activo)} onChange={(v) => set("activo", v)} label="Activo" />
          </div>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.filter((f) => f.key !== "activo").map((f) => (
          <div key={f.key} className={f.wide || f.type === "textarea" || f.type === "colors" ? "sm:col-span-2" : ""}>
            <Field label={f.label} hint={f.hint}>
              {f.type === "text" && <input className={inputCls} value={str(draft[f.key])} onChange={(e) => set(f.key, e.target.value)} />}
              {f.type === "number" && <input className={inputCls} type="number" step="any" value={str(draft[f.key])} onChange={(e) => set(f.key, e.target.value)} />}
              {f.type === "textarea" && <textarea className={`${inputCls} min-h-24`} value={str(draft[f.key])} onChange={(e) => set(f.key, e.target.value)} />}
              {f.type === "colors" && <input className={inputCls} placeholder="Carbón=#333333, Crema=#F5EBD7" value={str(draft[f.key])} onChange={(e) => set(f.key, e.target.value)} />}
              {f.type === "select" && (
                <select className={inputCls} value={str(draft[f.key])} onChange={(e) => set(f.key, e.target.value)}>
                  {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              )}
              {f.type === "bool" && (
                <div className="flex h-10 items-center gap-2 text-sm">
                  <Toggle checked={Boolean(draft[f.key])} onChange={(v) => set(f.key, v)} label={f.label} />
                  <span className="text-brand-text/60">{draft[f.key] ? "Sí" : "No"}</span>
                </div>
              )}
              {f.type === "media" && (
                <MediaUpload value={str(draft[f.key])} onChange={(u) => set(f.key, u)} folder={f.folder ?? "productos"} accept={f.accept} onError={onError} />
              )}
            </Field>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Btn onClick={save} busy={busy}><Save size={16} /> Guardar</Btn>
        {!isNew && <Btn variant="danger" onClick={remove} disabled={busy}><Trash2 size={16} /> Eliminar</Btn>}
      </div>
    </Card>
  );
}
