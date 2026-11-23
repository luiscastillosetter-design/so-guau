import { Suspense } from "react";
import type { Metadata } from "next";
import TopBcvBar from "@/components/TopBcvBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TiendaClient from "@/components/TiendaClient";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Tienda — So Guau",
  description: "Franelas, hoodies, gorras, tazas y coolers para ti y tu mascota.",
};

async function Catalog() {
  const catalog = await getCatalog();
  return <TiendaClient catalog={catalog} />;
}

export default function TiendaPage() {
  return (
    <>
      <TopBcvBar />
      <Navbar />
      <main className="min-h-[60vh] pb-20 md:pb-0">
        <Suspense fallback={<div className="container-wide py-32 text-center font-display text-xl text-brand-primary/60">Cargando colección…</div>}>
          <Catalog />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
