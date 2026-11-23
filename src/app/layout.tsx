import type { Metadata } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import StoreAssistant from "@/components/StoreAssistant";
import { getStoreSettings } from "@/lib/store";
import { getTheme } from "@/lib/themes";

const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], display: "swap" });
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://soguau.com"),
  title: "So Guau — Moda que deja huellas",
  description: "Moda para ti y tu mascota. Prendas y objetos personalizados con diseños que dejan huellas.",
  openGraph: {
    title: "So Guau — Moda que deja huellas",
    description: "Moda para ti y tu mascota, con diseños personalizados.",
    url: "https://soguau.com",
    siteName: "So Guau",
    locale: "es_VE",
    type: "website",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getStoreSettings();
  const theme = getTheme(settings.themeKey).key;
  return (
    <html lang="es" data-theme={theme} className={`${playfair.variable} ${montserrat.variable}`}>
      <body className="min-h-screen antialiased">
        <CartProvider>
          {children}
          <CartDrawer />
          <StoreAssistant />
        </CartProvider>
      </body>
    </html>
  );
}
