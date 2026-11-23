import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone, Share2 } from "lucide-react";
import TopBcvBar from "@/components/TopBcvBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getStoreSettings } from "@/lib/store";

export const metadata: Metadata = {
  title: "Contacto — So Guau",
  description: "Escríbenos por WhatsApp, correo o redes. Estamos para ayudarte a vestir a tu mejor amigo.",
};

function Item({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-brand-primary/15 py-6">
      <p className="flex items-center gap-2 font-ui text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-primary/60"><Icon className="h-4 w-4" />{label}</p>
      <div className="mt-2 font-display text-2xl text-brand-primary md:text-3xl">{children}</div>
    </div>
  );
}

export default async function ContactoPage() {
  const s = await getStoreSettings();
  const socials = [
    { url: s.instagramUrl, label: "Instagram" },
    { url: s.tiktokUrl, label: "TikTok" },
    { url: s.facebookUrl, label: "Facebook" },
  ].filter((x) => x.url);
  const link = "transition-colors hover:text-brand-accent";
  return (
    <>
      <TopBcvBar />
      <Navbar />
      <main className="container-wide pb-28 pt-12 md:pb-20 md:pt-20">
        <p className="font-ui text-[10px] font-semibold uppercase tracking-[0.35em] text-brand-primary/70">Contacto · {s.brandName}</p>
        <h1 className="mt-3 font-display text-5xl leading-[1.05] text-brand-primary md:text-7xl">Hablemos <em className="text-brand-accent">sin ladridos</em></h1>
        <p className="mt-4 max-w-xl font-ui text-sm leading-relaxed text-brand-text/70">{s.footerDescripcion}</p>
        <div className="mt-10 grid gap-x-16 md:grid-cols-2">
          <div>
            {s.whatsapp && (
              <Item icon={MessageCircle} label="WhatsApp">
                <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-full bg-brand-primary px-7 py-3 font-ui text-xs font-semibold uppercase tracking-widest text-brand-on-primary transition hover:-translate-y-0.5">
                  Escríbenos · +{s.whatsapp}
                </a>
              </Item>
            )}
            {s.telefono && <Item icon={Phone} label="Teléfono"><a href={`tel:${s.telefono.replace(/[^\d+]/g, "")}`} className={link}>{s.telefono}</a></Item>}
            {s.email && <Item icon={Mail} label="Correo"><a href={`mailto:${s.email}`} className={`break-all ${link}`}>{s.email}</a></Item>}
          </div>
          <div>
            {s.direccion && <Item icon={MapPin} label="Dirección">{s.direccion}</Item>}
            {s.horario && <Item icon={Clock} label="Horario de atención">{s.horario}</Item>}
            {socials.length > 0 && (
              <Item icon={Share2} label="Redes">
                <ul className="flex flex-wrap gap-x-6 gap-y-1">
                  {socials.map(({ url, label }) => (
                    <li key={label}><a href={url} target="_blank" rel="noopener noreferrer" className={`underline decoration-brand-accent underline-offset-4 ${link}`}>{label}</a></li>
                  ))}
                </ul>
              </Item>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
