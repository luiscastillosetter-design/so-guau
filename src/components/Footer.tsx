import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-brand-primary/10 bg-brand-bg pb-28 pt-12 md:pb-12">
      <div className="container-wide flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-3xl text-brand-primary">So Guau</p>
          <p className="mt-1 font-display text-lg italic text-brand-accent">Moda que deja huellas</p>
        </div>
        <ul className="flex flex-wrap gap-x-8 gap-y-2 font-ui text-xs font-medium uppercase tracking-widest text-brand-primary">
          <li><Link href="/tienda" className="hover:text-brand-accent">Tienda</Link></li>
          <li><Link href="/estudio" className="hover:text-brand-accent">Personalizador IA</Link></li>
          <li><Link href="/checkout" className="hover:text-brand-accent">Carrito</Link></li>
        </ul>
      </div>
      <p className="container-wide mt-10 font-ui text-[10px] uppercase tracking-[0.25em] text-brand-text/50">
        © So Guau · Hecho con cariño para ti y tu mejor amigo
      </p>
    </footer>
  );
}
