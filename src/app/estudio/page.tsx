import { Suspense } from "react";
import type { Metadata } from "next";
import TopBcvBar from "@/components/TopBcvBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StudioClient from "@/components/StudioClient";
import { getCatalog } from "@/lib/catalog";
import { getTemplates } from "@/lib/studio";

export const metadata: Metadata = {
  title: "Estudio Personalizador IA — So Guau",
  description: "Crea un diseño único con tu mascota y pruébalo en tu prenda, taza o cooler.",
};

async function Studio() {
  const [catalog, templates] = await Promise.all([getCatalog(), getTemplates()]);
  return <StudioClient products={catalog.products} templates={templates} />;
}

export default function EstudioPage() {
  return (
    <>
      <TopBcvBar />
      <Navbar />
      <main className="min-h-[60vh] pb-24 md:pb-0">
        <Suspense fallback={<div className="container-wide py-40 text-center font-display text-xl text-brand-primary/60">Preparando el estudio…</div>}>
          <Studio />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
