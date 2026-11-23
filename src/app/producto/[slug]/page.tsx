import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TopBcvBar from "@/components/TopBcvBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductDetail from "@/components/ProductDetail";
import { getCatalog } from "@/lib/catalog";
import { getBlankStock } from "@/lib/store";

export async function generateStaticParams() {
  const { products } = await getCatalog();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { products } = await getCatalog();
  const p = products.find((x) => x.slug === slug);
  return p ? { title: `${p.name} — So Guau`, description: `${p.name} desde $${p.priceUsd.toFixed(2)}. Moda que deja huellas.` } : { title: "Producto — So Guau" };
}

async function Content({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { products } = await getCatalog();
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();
  const stock = await getBlankStock(product.formatSlug);
  const others = products.filter((p) => p.id !== product.id);
  const related = [
    ...others.filter((p) => p.departmentSlug === product.departmentSlug || p.formatSlug === product.formatSlug),
    ...others,
  ]
    .filter((p, i, arr) => arr.findIndex((q) => q.id === p.id) === i)
    .slice(0, 8);
  return <ProductDetail product={product} stock={stock} related={related} />;
}

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <>
      <TopBcvBar />
      <Navbar />
      <main className="min-h-[60vh] pb-40 md:pb-0">
        <Suspense fallback={<div className="container-wide py-40 text-center font-display text-xl text-brand-primary/60">Cargando producto…</div>}>
          <Content params={params} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
