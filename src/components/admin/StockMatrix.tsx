"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Btn, Card, Field, Toggle, inputCls, str, type Row } from "./ui";

export default function StockMatrix({
  formats, stock, onToggle, onAdd,
}: {
  formats: Row[]; stock: Row[];
  onToggle: (id: string, inStock: boolean) => Promise<boolean>;
  onAdd: (values: Row) => Promise<boolean>;
}) {
  const [formatId, setFormatId] = useState("");
  const [color, setColor] = useState("");
  const [talla, setTalla] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    const fid = formatId || str(formats[0]?.id);
    if (!fid || !color.trim()) return;
    setBusy(true);
    const ok = await onAdd({ format_id: fid, color: color.trim(), talla: talla.trim() || null, in_stock: true });
    setBusy(false);
    if (ok) { setColor(""); setTalla(""); }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_8rem_auto]">
          <Field label="Formato">
            <select className={inputCls} value={formatId || str(formats[0]?.id)} onChange={(e) => setFormatId(e.target.value)}>
              {formats.map((f) => <option key={str(f.id)} value={str(f.id)}>{str(f.nombre)}</option>)}
            </select>
          </Field>
          <Field label="Color"><input className={inputCls} value={color} onChange={(e) => setColor(e.target.value)} placeholder="Carbón" /></Field>
          <Field label="Talla"><input className={inputCls} value={talla} onChange={(e) => setTalla(e.target.value)} placeholder="M" /></Field>
          <Btn onClick={add} busy={busy}><Plus size={16} /> Añadir</Btn>
        </div>
      </Card>

      {formats.map((fmt) => {
        const rows = stock.filter((s) => s.format_id === fmt.id);
        if (!rows.length) return null;
        const colors = [...new Set(rows.map((r) => str(r.color)))];
        const sizes = [...new Set(rows.map((r) => str(r.talla)))];
        return (
          <Card key={str(fmt.id)} className="overflow-x-auto">
            <h3 className="mb-3 font-semibold">{str(fmt.nombre)} <span className="text-sm font-normal text-brand-text/50">· interruptor encendido = disponible</span></h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-brand-text/60">
                  <th className="py-2 pr-4">Color</th>
                  {sizes.map((z) => <th key={z} className="px-2 py-2 text-center">{z || "Única"}</th>)}
                </tr>
              </thead>
              <tbody>
                {colors.map((c) => (
                  <tr key={c} className="border-t border-brand-text/10">
                    <td className="py-2.5 pr-4 font-medium">{c}</td>
                    {sizes.map((z) => {
                      const cell = rows.find((r) => str(r.color) === c && str(r.talla) === z);
                      return (
                        <td key={z} className="px-2 py-2.5 text-center">
                          {cell ? (
                            <div className="flex justify-center"><Toggle checked={Boolean(cell.in_stock)} label={`${c} ${z}`} onChange={(v) => onToggle(str(cell.id), v)} /></div>
                          ) : <span className="text-brand-text/30">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        );
      })}
      {!stock.length && <p className="py-6 text-center text-sm text-brand-text/50">Sin registros de stock. Añade el primer color/talla arriba.</p>}
    </div>
  );
}
