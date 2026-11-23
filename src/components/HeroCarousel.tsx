"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroSlide } from "@/lib/catalog";

const DURATION = 7;

export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const count = slides.length;
  const slide = slides[index];

  function go(delta: number) {
    setDir(delta);
    setIndex((i) => (i + delta + count) % count);
  }

  if (!slide) return null;

  return (
    <section className="bg-brand-bg py-6 md:py-10" aria-label="Destacados">
      <div className="container-wide">
        <div className="group relative overflow-hidden rounded-[1.75rem] bg-brand-primary md:rounded-[2.5rem]">
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.div
              key={slide.id}
              custom={dir}
              initial={{ opacity: 0, x: dir * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -60 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) go(1);
                else if (info.offset.x > 60) go(-1);
              }}
              className="relative aspect-[4/5] w-full cursor-grab touch-pan-y active:cursor-grabbing sm:aspect-[16/10] lg:aspect-[16/6.5]"
            >
              {slide.mediaType === "video" ? (
                <video className="absolute inset-0 h-full w-full object-cover" src={slide.mediaUrl} poster={slide.poster} autoPlay muted loop playsInline />
              ) : (
                <div role="img" aria-label={slide.title} className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${slide.mediaUrl})` }} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent md:bg-gradient-to-r md:from-black/60 md:via-black/15 md:to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 pb-14 sm:p-10 sm:pb-16 md:inset-y-0 md:flex md:max-w-2xl md:flex-col md:justify-center md:p-16">
                <p className="font-ui text-[10px] font-semibold uppercase tracking-[0.35em] text-brand-accent">
                  {String(index + 1).padStart(2, "0")} — {String(count).padStart(2, "0")}
                </p>
                <h2 className="mt-3 font-display text-4xl leading-[1.05] text-white md:text-6xl">{slide.title}</h2>
                <p className="mt-3 max-w-md font-ui text-sm leading-relaxed text-white/85 md:text-base">{slide.subtitle}</p>
                <Link href={slide.ctaLink} className="group/cta mt-6 inline-flex w-fit items-center gap-3 rounded-full bg-brand-accent px-7 py-3.5 font-ui text-xs font-bold uppercase tracking-widest text-brand-text transition hover:-translate-y-0.5">
                  {slide.ctaText}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-1" />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

          {count > 1 && (
            <>
              <button type="button" aria-label="Anterior" onClick={() => go(-1)} className="absolute left-5 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur transition hover:bg-white/30 group-hover:opacity-100 md:grid">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button type="button" aria-label="Siguiente" onClick={() => go(1)} className="absolute right-5 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur transition hover:bg-white/30 group-hover:opacity-100 md:grid">
                <ChevronRight className="h-6 w-6" />
              </button>
              <div className="absolute inset-x-6 bottom-5 flex items-center gap-2 md:inset-x-16 md:bottom-8 md:gap-3">
                {slides.map((s, i) => (
                  <button key={s.id} type="button" aria-label={`Ir a ${s.title}`} onClick={() => { setDir(i > index ? 1 : -1); setIndex(i); }} className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/25 md:max-w-28">
                    {i < index && <span className="absolute inset-0 bg-white/80" />}
                    {i === index && (
                      <motion.span
                        key={`${slide.id}-${index}`}
                        className="absolute inset-y-0 left-0 bg-brand-accent"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: DURATION, ease: "linear" }}
                        onAnimationComplete={() => go(1)}
                      />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
