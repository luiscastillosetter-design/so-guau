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

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const brand = settings.brandName || "So Guau";
  const slogan = settings.eslogan || "Moda que deja huellas";
  const title = `${brand} — ${slogan}`;
  const icon = settings.logoUrl || "/icon.svg";
  return {
    metadataBase: new URL("https://soguau.com"),
    title,
    description: settings.footerDescripcion || "Moda para ti y tu mascota. Prendas y objetos personalizados con diseños que dejan huellas.",
    icons: { icon, apple: icon },
    openGraph: {
      title,
      description: "Moda para ti y tu mascota, con diseños personalizados.",
      url: "https://soguau.com",
      siteName: brand,
      locale: "es_VE",
      type: "website",
    },
  };
}

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
