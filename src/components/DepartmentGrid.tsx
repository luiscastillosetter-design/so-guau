import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import type { Department } from "@/lib/catalog";

const tones = [
  "bg-brand-primary text-brand-on-primary",
  "bg-[#EFE7D2] text-brand-primary",
  "bg-brand-accent text-brand-text",
  "bg-[#2B2B2B] text-brand-on-primary",
  "bg-[#DCE6D3] text-brand-primary",
];

export default function DepartmentGrid({ departments }: { departments: Department[] }) {
  const rooms = departments.filter((d) => d.slug !== "destacados");
  return (
    <section className="bg-brand-bg py-14 md:py-24" aria-label="Habitaciones">
      <div className="container-wide">
        <div className="mb-8 md:mb-12">
          <p className="font-ui text-[10px] font-semibold uppercase tracking-[0.35em] text-brand-primary/70">Habitaciones</p>
          <h2 className="mt-3 font-display text-4xl text-brand-primary md:text-6xl">Entra a tu mundo</h2>
        </div>

        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 xl:grid-cols-5">
          {rooms.map((d, i) => (
            <Link
              key={d.slug}
              href={`/tienda?dept=${d.slug}`}
              className={`group relative flex aspect-[4/5] w-[72vw] shrink-0 snap-center flex-col justify-between overflow-hidden rounded-[1.75rem] p-6 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_28px_40px_-22px_rgba(20,38,22,0.55)] md:w-auto md:rounded-[2rem] md:p-7 ${tones[i % tones.length]}`}
            >
              <span className="font-display text-7xl italic leading-none opacity-30 transition-transform duration-500 group-hover:scale-110 md:text-8xl">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-display text-3xl leading-tight">{d.name}</h3>
                <p className="mt-2 font-ui text-xs leading-relaxed opacity-80">{d.subtitle}</p>
                <span className="mt-5 inline-flex items-center gap-2 font-ui text-[10px] font-bold uppercase tracking-[0.25em]">
                  Entrar
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/estudio"
          className="group relative mt-6 flex flex-col gap-6 overflow-hidden rounded-[2rem] bg-brand-primary p-8 text-brand-on-primary transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_28px_40px_-22px_rgba(20,38,22,0.6)] md:mt-8 md:flex-row md:items-center md:justify-between md:p-14"
        >
          <span aria-hidden className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-brand-accent/30 blur-2xl transition-transform duration-700 group-hover:scale-125" />
          <div className="relative max-w-2xl">
            <p className="flex items-center gap-2 font-ui text-[10px] font-semibold uppercase tracking-[0.35em] text-brand-accent">
              <Sparkles className="h-4 w-4" /> Estudio Personalizador IA
            </p>
            <h3 className="mt-4 font-display text-3xl leading-tight md:text-5xl">Sube la foto de tu mascota y mírala en tu prenda en segundos</h3>
          </div>
          <span className="relative inline-flex w-fit items-center gap-3 rounded-full bg-brand-accent px-8 py-4 font-ui text-xs font-bold uppercase tracking-widest text-brand-text">
            Probar el estudio
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </section>
  );
}
