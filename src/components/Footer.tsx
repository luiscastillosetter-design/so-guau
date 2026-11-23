import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getStoreSettings } from "@/lib/store";

const Insta = (p: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={p.className} aria-hidden><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
);
const Tik = (p: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={p.className} aria-hidden><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" /><path d="M14 3c.4 2.6 2 4.2 5 4.5" /></svg>
);
const Face = (p: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={p.className} aria-hidden><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8Z" /></svg>
);

export default async function Footer() {
  const s = await getStoreSettings();
  const socials = [
    { url: s.instagramUrl, label: "Instagram", Icon: Insta },
    { url: s.tiktokUrl, label: "TikTok", Icon: Tik },
    { url: s.facebookUrl, label: "Facebook", Icon: Face },
  ].filter((x) => x.url);
  const row = "flex items-start gap-2";
  const ico = "mt-0.5 h-4 w-4 shrink-0 text-brand-primary";
  return (
    <footer className="border-t border-brand-primary/10 bg-brand-bg pb-28 pt-12 md:pb-10">
      <div className="container-wide grid gap-10 md:grid-cols-[1.3fr_1fr_1.2fr]">
        <div>
          {s.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.logoUrl} alt={s.brandName} className="h-12 w-auto object-contain" />
          ) : (
            <p className="font-display text-3xl text-brand-primary">{s.brandName}</p>
          )}
          <p className="mt-2 font-display text-lg italic text-brand-accent">{s.eslogan}</p>
          <p className="mt-3 max-w-sm font-ui text-sm leading-relaxed text-brand-text/70">{s.footerDescripcion}</p>
          {socials.length > 0 && (
            <div className="mt-5 flex gap-3">
              {socials.map(({ url, label, Icon }) => (
                <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid h-10 w-10 place-items-center rounded-full border border-brand-primary/25 text-brand-primary transition hover:bg-brand-primary hover:text-brand-on-primary">
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          )}
        </div>
        <ul className="space-y-2 font-ui text-xs font-medium uppercase tracking-widest text-brand-primary">
          <li><Link href="/tienda" className="hover:text-brand-accent">Tienda</Link></li>
          <li><Link href="/estudio" className="hover:text-brand-accent">Personalizador IA</Link></li>
          <li><Link href="/contacto" className="hover:text-brand-accent">Contacto</Link></li>
          <li><Link href="/checkout" className="hover:text-brand-accent">Carrito</Link></li>
        </ul>
        <ul className="space-y-2.5 font-ui text-sm text-brand-text/80">
          {s.whatsapp && <li className={row}><MessageCircle className={ico} /><a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent">WhatsApp +{s.whatsapp}</a></li>}
          {s.telefono && <li className={row}><Phone className={ico} /><a href={`tel:${s.telefono.replace(/[^\d+]/g, "")}`} className="hover:text-brand-accent">{s.telefono}</a></li>}
          {s.email && <li className={row}><Mail className={ico} /><a href={`mailto:${s.email}`} className="break-all hover:text-brand-accent">{s.email}</a></li>}
          {s.direccion && <li className={row}><MapPin className={ico} />{s.direccion}</li>}
          {s.horario && <li className={row}><Clock className={ico} />{s.horario}</li>}
        </ul>
      </div>
      <div className="container-wide mt-10 flex items-center justify-between gap-4">
        <p className="font-ui text-[10px] uppercase tracking-[0.25em] text-brand-text/50">© {s.brandName} · Hecho con cariño para ti y tu mejor amigo</p>
        <Link href="/admin" className="font-ui text-[10px] uppercase tracking-[0.25em] text-brand-text/30 hover:text-brand-text/60">Admin</Link>
      </div>
    </footer>
  );
}
