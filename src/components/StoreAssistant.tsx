"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Send, X } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const CHIPS = ["¿Qué talla soy?", "Cuidados del DTF", "¿Cómo personalizo con mi mascota?", "¿Cómo pago por Pago Móvil o Binance?"];

export default function StoreAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy, open]);

  if (pathname?.startsWith("/admin")) return null;

  async function send(text: string) {
    const content = text.trim().slice(0, 350);
    if (!content || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await res.json()) as { reply?: string };
      setMsgs([...next, { role: "assistant", content: data.reply ?? "Ups, intenta de nuevo en un momento." }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "No pude conectarme. Intenta de nuevo o escríbenos por WhatsApp." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3 md:bottom-6 md:right-6">
      {open && (
        <div
          role="dialog"
          aria-label="Asistente So Guau"
          className="flex h-[min(30rem,70vh)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-brand-primary/15 bg-brand-bg shadow-xl"
        >
          <div className="flex items-center justify-between bg-brand-primary px-4 py-3 text-brand-on-primary">
            <div>
              <p className="font-display text-lg leading-tight">Asistente So Guau</p>
              <p className="font-ui text-[11px] opacity-80">Tallas, DTF, envíos y pagos</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar asistente" className="rounded-full p-1.5 hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 font-ui text-sm text-brand-text">
            <p className="rounded-2xl rounded-bl-sm bg-brand-primary/5 px-3 py-2">¡Hola! 🐾 Soy el asistente de So Guau. ¿En qué te ayudo?</p>
            {msgs.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {CHIPS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => send(c)}
                    className="rounded-full border border-brand-accent bg-brand-accent/15 px-3 py-1.5 text-left text-xs font-medium text-brand-primary hover:bg-brand-accent/30"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
            {msgs.map((m, i) => (
              <p
                key={i}
                className={`whitespace-pre-wrap break-words rounded-2xl px-3 py-2 ${
                  m.role === "user" ? "ml-8 rounded-br-sm bg-brand-primary text-brand-on-primary" : "mr-8 rounded-bl-sm bg-brand-primary/5"
                }`}
              >
                {m.content}
              </p>
            ))}
            {busy && <p className="mr-8 rounded-2xl bg-brand-primary/5 px-3 py-2 opacity-70">Escribiendo…</p>}
            <div ref={endRef} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-brand-primary/10 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={350}
              placeholder="Escribe tu pregunta…"
              className="min-w-0 flex-1 rounded-full border border-brand-primary/20 bg-white/60 px-4 py-2 font-ui text-sm text-brand-text outline-none focus:border-brand-primary"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Enviar"
              className="grid h-9 w-9 place-items-center rounded-full bg-brand-primary text-brand-on-primary disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir asistente de ayuda"
          className="group flex items-center gap-2 rounded-full bg-brand-primary py-2.5 pl-3 pr-4 text-brand-on-primary shadow-lg ring-2 ring-brand-accent transition hover:scale-[1.03]"
        >
          <MessageCircle className="h-5 w-5 text-brand-accent" />
          <span className="font-ui text-xs font-semibold tracking-wide">¿Te ayudo?</span>
        </button>
      )}
    </div>
  );
}
