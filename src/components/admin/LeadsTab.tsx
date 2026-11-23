"use client";

import { MessageCircle } from "lucide-react";
import { Btn, Card, SectionTitle, digits, str, type Row } from "./ui";

export default function LeadsTab({ leads }: { leads: Row[] }) {
  return (
    <div>
      <SectionTitle title="Leads IA" sub="Personas que probaron el personalizador — ciérrales la venta" />
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {leads.map((l) => {
          const wa = digits(l.whatsapp);
          const name = str(l.nombre) || "Sin nombre";
          return (
            <Card key={str(l.id)} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{name}</p>
                <p className="text-sm text-brand-text/60">{str(l.whatsapp) || "Sin WhatsApp"}</p>
                <p className="text-xs text-brand-text/50">
                  {Number(l.generaciones_usadas) || 0} generaciones · {l.ultima_generacion_at ? new Date(str(l.ultima_generacion_at)).toLocaleDateString("es-VE") : "—"}
                </p>
              </div>
              {wa && (
                <Btn variant="accent" href={`https://wa.me/${wa}?text=${encodeURIComponent(`¡Hola ${name}! Vimos que probaste el personalizador de So Guau 🐾 ¿Te ayudamos a imprimir tu diseño?`)}`}>
                  <MessageCircle size={16} /> <span className="hidden sm:inline">Escribir por WhatsApp</span><span className="sm:hidden">Escribir</span>
                </Btn>
              )}
            </Card>
          );
        })}
      </div>
      {!leads.length && <p className="py-10 text-center text-sm text-brand-text/50">Aún no hay leads.</p>}
    </div>
  );
}
