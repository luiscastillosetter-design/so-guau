import TopBcvBar from "@/components/TopBcvBar";
import Navbar from "@/components/Navbar";
import InteractiveShowcase from "@/components/InteractiveShowcase";
import HeroCarousel from "@/components/HeroCarousel";
import DepartmentGrid from "@/components/DepartmentGrid";
import Footer from "@/components/Footer";
import { getCatalog } from "@/lib/catalog";

export default async function Home() {
  const catalog = await getCatalog();
  return (
    <>
      <TopBcvBar />
      <Navbar />
      <main className="pb-20 md:pb-0">
        <InteractiveShowcase catalog={catalog} />
        <HeroCarousel slides={catalog.slides} />
        <DepartmentGrid departments={catalog.departments} />
      </main>
      <Footer />
    </>
  );
}
