"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { Department, ProductFormat } from "@/lib/catalog";

interface Props {
  departments: Department[];
  formats: ProductFormat[];
  department: string;
  format: string;
  onDepartment: (slug: string) => void;
  onFormat: (slug: string) => void;
}

function pill(active: boolean) {
  return `shrink-0 whitespace-nowrap rounded-full border px-5 py-2.5 font-ui text-xs font-semibold uppercase tracking-[0.16em] transition-all duration-300 ${
    active
      ? "border-brand-primary bg-brand-primary text-brand-on-primary shadow-[0_6px_18px_-8px_rgba(30,77,36,0.7)]"
      : "border-brand-primary/20 bg-transparent text-brand-primary hover:-translate-y-0.5 hover:border-brand-primary/60"
  }`;
}

export default function CatalogFilters({ departments, formats, department, format, onDepartment, onFormat }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <span className="hidden w-20 shrink-0 font-ui text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-primary/60 md:block">Tema</span>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide md:mx-0 md:px-0" role="tablist" aria-label="Departamento">
          {departments.map((d) => (
            <button key={d.slug} type="button" role="tab" aria-selected={department === d.slug} onClick={() => onDepartment(d.slug)} className={pill(department === d.slug)}>
              {d.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden w-20 shrink-0 font-ui text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-primary/60 md:block">Formato</span>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide md:mx-0 md:px-0" role="tablist" aria-label="Formato">
          {formats.map((f) => (
            <button key={f.slug} type="button" role="tab" aria-selected={format === f.slug} onClick={() => onFormat(f.slug)} className={pill(format === f.slug)}>
              {f.name}
            </button>
          ))}
          <Link
            href="/estudio"
            className="group ml-1 flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-brand-accent px-5 py-2.5 font-ui text-xs font-bold uppercase tracking-[0.16em] text-brand-text shadow-[0_8px_20px_-10px_rgba(249,145,195,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-10px_rgba(249,145,195,1)]"
          >
            <Sparkles className="h-4 w-4 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
            Crear con IA
          </Link>
        </div>
      </div>
    </div>
  );
}
