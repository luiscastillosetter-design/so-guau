"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/catalog";
import ProductArt from "@/components/ProductArt";
import Price from "@/components/Price";

export default function ProductCard({ product }: { product: Product }) {
  const [colorIdx, setColorIdx] = useState(0);
  const color = product.colors[colorIdx] ?? product.colors[0];
  const hex = color?.hex ?? "#FFFFFF";
  const hasBack = product.kind === "tee" || product.kind === "hoodie" || Boolean(product.images.back);

  return (
    <article className="group relative flex flex-col">
      <Link href={`/producto/${product.slug}`} className="block" aria-label={product.name}>
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-brand-primary/10 bg-[#F1ECDB] transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-[0_24px_40px_-24px_rgba(20,38,22,0.45)]">
          <div className={`absolute inset-0 p-6 transition-all duration-500 md:p-8 ${hasBack ? "group-hover:scale-95 group-hover:opacity-0" : "group-hover:scale-105"}`}>
            <ProductArt product={product} color={hex} view="front" />
          </div>
          {hasBack && (
            <div className="absolute inset-0 scale-105 p-6 opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100 md:p-8">
              <ProductArt product={product} color={hex} view="back" />
            </div>
          )}
          {product.badge && (
            <span className="absolute left-3 top-3 rounded-full bg-brand-primary px-3 py-1 font-ui text-[10px] font-bold uppercase tracking-[0.14em] text-brand-on-primary">
              {product.badge}
            </span>
          )}
          {hasBack && (
            <span className="pointer-events-none absolute bottom-3 right-3 hidden rounded-full bg-brand-bg/90 px-2.5 py-1 font-ui text-[10px] font-semibold uppercase tracking-widest text-brand-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:block">
              Espalda
            </span>
          )}
        </div>
      </Link>

      <div className="mt-4 flex flex-1 flex-col gap-2">
        <Link href={`/producto/${product.slug}`}>
          <h3 className="font-display text-base leading-snug text-brand-primary transition-colors group-hover:text-brand-text md:text-xl">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Color">
          {product.colors.map((c, i) => (
            <button
              key={c.name}
              type="button"
              role="radio"
              aria-checked={i === colorIdx}
              aria-label={c.name}
              title={c.name}
              onClick={() => setColorIdx(i)}
              onMouseEnter={() => setColorIdx(i)}
              className={`grid h-7 w-7 place-items-center rounded-full transition-transform hover:scale-110 ${i === colorIdx ? "ring-2 ring-brand-primary ring-offset-2 ring-offset-brand-bg" : ""}`}
            >
              <span className="h-5 w-5 rounded-full border border-black/15" style={{ backgroundColor: c.hex }} />
            </button>
          ))}
        </div>
        <Price usdValue={product.priceUsd} compareAtUsd={product.compareAtUsd} />
      </div>
    </article>
  );
}
