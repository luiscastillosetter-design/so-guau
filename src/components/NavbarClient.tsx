"use client";

import Link from "next/link";
import { ShoppingBag, Sparkles, Store } from "lucide-react";
import { useCart } from "@/context/CartContext";

const links = [
  { href: "/tienda", label: "Tienda", short: "Tienda", icon: Store },
  { href: "/estudio", label: "Personalizador IA", short: "Crear IA", icon: Sparkles },
];

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="absolute -right-2 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-accent px-1 font-ui text-[10px] font-bold text-brand-text">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function NavbarClient({ logoUrl }: { logoUrl?: string | null }) {
  const { count, openCart } = useCart();
  return (
    <>
      <header className="sticky top-9 z-40 w-full border-b border-brand-primary/10 bg-brand-bg/90 backdrop-blur">
        <nav className="container-wide flex h-16 items-center justify-between md:h-20">
          <Link href="/" className="flex items-center gap-3" aria-label="So Guau — inicio">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="So Guau" className="h-11 w-auto object-contain md:h-12" />
            ) : (
              <>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-primary font-display text-lg text-brand-on-primary">S</span>
                <span className="font-display text-2xl font-semibold tracking-tight text-brand-primary md:text-3xl">So Guau</span>
              </>
            )}
          </Link>
          <ul className="hidden items-center gap-10 font-ui text-sm font-medium uppercase tracking-widest md:flex">
            {links.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="transition-colors hover:text-brand-accent">
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <button type="button" onClick={openCart} aria-label={`Abrir carrito (${count})`} className="relative flex items-center gap-2 transition-colors hover:text-brand-accent">
                Carrito
                <span className="relative">
                  <ShoppingBag className="h-5 w-5" />
                  <Badge count={count} />
                </span>
              </button>
            </li>
          </ul>
          <button type="button" onClick={openCart} className="relative grid h-11 w-11 place-items-center md:hidden" aria-label={`Abrir carrito (${count})`}>
            <span className="relative">
              <ShoppingBag className="h-6 w-6 text-brand-primary" />
              <Badge count={count} />
            </span>
          </button>
        </nav>
      </header>

      {/* Navegación móvil tipo app */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-primary/10 bg-brand-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="grid grid-cols-3">
          {links.map(({ href, short, icon: Icon }) => (
            <li key={href}>
              <Link href={href} className="flex h-[60px] flex-col items-center justify-center gap-1 font-ui text-[10px] font-medium text-brand-primary">
                <Icon className="h-5 w-5" />
                {short}
              </Link>
            </li>
          ))}
          <li>
            <button type="button" onClick={openCart} className="flex h-[60px] w-full flex-col items-center justify-center gap-1 font-ui text-[10px] font-medium text-brand-primary">
              <span className="relative">
                <ShoppingBag className="h-5 w-5" />
                <Badge count={count} />
              </span>
              Carrito
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
