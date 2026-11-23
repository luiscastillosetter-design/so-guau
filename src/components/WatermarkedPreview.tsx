"use client";

import { useEffect, useRef } from "react";
import type { ProductKind } from "@/lib/catalog";
import { Mockup, aspectOf, isLight } from "@/components/ProductArt";
import type { PositionId } from "@/lib/studio-config";

interface Zone {
  left: number;
  top: number;
  w: number;
  h: number;
}

// Zonas seguras de estampado (% del viewBox del mockup)
const ZONES: Record<ProductKind, Partial<Record<PositionId, Zone>> & { front: Zone }> = {
  tee: { front: { left: 30, top: 32, w: 40, h: 45 }, pecho: { left: 30, top: 32, w: 40, h: 45 }, corazon: { left: 56, top: 30, w: 15, h: 17 }, espalda: { left: 30, top: 22, w: 40, h: 50 } },
  hoodie: { front: { left: 32, top: 38, w: 36, h: 33 }, pecho: { left: 32, top: 38, w: 36, h: 33 }, corazon: { left: 56, top: 36, w: 14, h: 12 }, espalda: { left: 31, top: 30, w: 38, h: 50 } },
  mug: { front: { left: 25, top: 33, w: 44, h: 45 } },
  cooler: { front: { left: 31, top: 33, w: 38, h: 50 } },
  cap: { front: { left: 35, top: 22, w: 30, h: 36 } },
};

const LABEL = "SO GUAU • VISTA PREVIA";

interface Props {
  kind: ProductKind;
  color: string;
  position: PositionId;
  artUrl?: string;
  className?: string;
}

export default function WatermarkedPreview({ kind, color, position, artUrl, className = "" }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apparel = kind === "tee" || kind === "hoodie";
  const back = apparel && position === "espalda";
  const zone = ZONES[kind][apparel ? position : "front"] ?? ZONES[kind].front;
  const light = isLight(color);

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas) return;
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = box.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);
      const fontPx = Math.max(11, Math.min(16, width / 26));
      ctx.font = `700 ${fontPx}px Montserrat, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.translate(width / 2, height / 2);
      ctx.rotate(-Math.PI / 6);
      const stepX = ctx.measureText(LABEL).width + 48;
      const stepY = fontPx * 4.2;
      const reach = Math.hypot(width, height) / 2 + stepX;
      let row = 0;
      for (let y = -reach; y < reach; y += stepY, row++) {
        for (let x = -reach + (row % 2 ? stepX / 2 : 0); x < reach; x += stepX) {
          ctx.lineWidth = 3;
          ctx.strokeStyle = "rgba(248,245,234,0.55)";
          ctx.strokeText(LABEL, x, y);
          ctx.fillStyle = "rgba(30,77,36,0.38)";
          ctx.fillText(LABEL, x, y);
        }
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={boxRef}
      className={`relative flex select-none items-center justify-center overflow-hidden bg-[#F8F5EA] ${className}`}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className="relative max-h-full max-w-full p-3" style={{ height: "100%", aspectRatio: aspectOf[kind] }}>
        <div className="relative h-full w-full">
          <Mockup kind={kind} motif="text" printText="" color={color} view={back ? "back" : "front"} />
          {artUrl ? (
            <div
              aria-hidden
              className={`pointer-events-none absolute ${light ? "mix-blend-multiply" : "rounded-md"}`}
              style={{ left: `${zone.left}%`, top: `${zone.top}%`, width: `${zone.w}%`, height: `${zone.h}%`, backgroundImage: `url(${artUrl})`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center" }}
            />
          ) : (
            <div aria-hidden className="pointer-events-none absolute rounded-lg border border-dashed border-brand-primary/40" style={{ left: `${zone.left}%`, top: `${zone.top}%`, width: `${zone.w}%`, height: `${zone.h}%` }} />
          )}
        </div>
      </div>
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />
    </div>
  );
}
