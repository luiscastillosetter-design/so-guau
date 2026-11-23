import type { Metadata } from "next";
import TopBcvBar from "@/components/TopBcvBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CheckoutClient from "@/components/CheckoutClient";
import { getStoreSettings } from "@/lib/store";

export const metadata: Metadata = { title: "Checkout — So Guau", robots: { index: false } };

export default async function CheckoutPage() {
  const settings = await getStoreSettings();
  return (
    <>
      <TopBcvBar />
      <Navbar />
      <main className="min-h-[60vh] pb-24 md:pb-0">
        <CheckoutClient settings={settings} />
      </main>
      <Footer />
    </>
  );
}
