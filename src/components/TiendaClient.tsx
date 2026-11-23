"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { Catalog } from "@/lib/catalog";
import CatalogFilters from "@/components/CatalogFilters";
import ProductCard from "@/components/ProductCard";

export default function TiendaClient({ catalog }: { catalog: Catalog }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const departments = useMemo(
    () => [{ slug: "todos", name: "Todos", subtitle: "Toda la colección" }, ...catalog.departments],
    [catalog.departments],
  );
  const wantedDept = params.get("dept") ?? "todos";
  const wantedFormat = params.get("formato") ?? "todo";
  const department = departments.some((d) => d.slug === wantedDept) ? wantedDept : "todos";
  const format = catalog.formats.some((f) => f.slug === wantedFormat) ? wantedFormat : "todo";

  const list = useMemo(
    () =>
      catalog.products.filter((p) => {
        const byDept = department === "todos" ? true : department === "destacados" ? p.featured : p.departmentSlug === department;
        const byFormat = format === "todo" ? true : p.formatSlug === format;
        return byDept && byFormat;
      }),
    [catalog.products, department, format],
  );

  function update(key: "dept" | "formato", value: string, neutral: string) {
    const next = new URLSearchParams(params.toString());
    if (value === neutral) next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const current = departments.find((d) => d.slug === department);

  return (
    <>
      <section className="border-b border-brand-primary/10">
        <div className="container-wide py-10 md:py-16">
          <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.35em] text-brand-accent">Colección</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-brand-primary md:text-6xl">{current?.name === "Todos" ? "La Tienda" : current?.name}</h1>
          <p className="mt-3 max-w-xl font-ui text-sm text-brand-text/70 md:text-base">{current?.subtitle}</p>
        </div>
      </section>

      <div className="sticky top-[6.25rem] z-30 border-b border-brand-primary/10 bg-brand-bg/95 backdrop-blur md:top-[7.25rem]">
        <div className="container-wide py-3 md:py-4">
          <CatalogFilters
            departments={departments}
            formats={catalog.formats}
            department={department}
            format={format}
            onDepartment={(s) => update("dept", s, "todos")}
            onFormat={(s) => update("formato", s, "todo")}
          />
        </div>
      </div>

      <section className="container-wide py-8 md:py-14">
        <p className="mb-6 font-ui text-xs uppercase tracking-[0.2em] text-brand-text/55">
          {list.length} {list.length === 1 ? "producto" : "productos"}
        </p>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${department}-${format}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {list.length ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:gap-x-8 md:gap-y-14 lg:grid-cols-4">
                {list.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <p className="py-24 text-center font-display text-2xl text-brand-primary/70">Aún no hay productos en esta combinación.</p>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </>
  );
}
