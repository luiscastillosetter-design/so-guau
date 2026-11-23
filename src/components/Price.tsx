"use client";

import { useCart } from "@/context/CartContext";
import { formatBs } from "@/lib/bcv";
import { usd } from "@/lib/shop";

interface Props {
  usdValue: number;
  compareAtUsd?: number;
  size?: "sm" | "lg";
  className?: string;
}

export default function Price({ usdValue, compareAtUsd, size = "sm", className = "" }: Props) {
  const { rate } = useCart();
  const big = size === "lg";
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-baseline gap-2">
        <span className={`font-ui font-bold text-brand-primary ${big ? "text-3xl md:text-4xl" : "text-base md:text-lg"}`}>{usd(usdValue)}</span>
        {compareAtUsd ? <span className={`font-ui text-brand-text/45 line-through ${big ? "text-base" : "text-xs"}`}>{usd(compareAtUsd)}</span> : null}
      </div>
      <span className={`font-ui text-brand-text/60 ${big ? "text-sm" : "text-[11px]"}`}>
        {rate ? `≈ Bs. ${formatBs(usdValue * rate)}` : "≈ Bs. --,--"}
        {big ? " · Tasa BCV" : ""}
      </span>
    </div>
  );
}
