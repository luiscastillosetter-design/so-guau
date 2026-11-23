"use client";

import { useEffect, useState } from "react";
import { formatBs } from "@/lib/bcv";

export default function TopBcvBar() {
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/bcv")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d?.rate) setRate(d.rate);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="sticky top-0 z-50 w-full bg-[#1E4D24] text-[#F8F5EA]">
      <div className="container-wide flex h-9 items-center justify-between font-ui text-[11px] tracking-wide md:text-xs">
        <span className="font-semibold">Tasa Oficial BCV: Bs. {rate ? formatBs(rate) : "--,--"}</span>
        <span className="hidden italic opacity-80 sm:inline">Moda que deja huellas 🐾</span>
      </div>
    </div>
  );
}
