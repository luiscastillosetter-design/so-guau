import { createClient } from "@supabase/supabase-js";
import { cacheLife } from "next/cache";

export type DisplayMode = "rack" | "shelf";
export type ProductKind = "tee" | "hoodie" | "mug" | "cooler" | "cap";
export type Motif = "paw" | "frenchie" | "cat" | "tree" | "tower" | "text";
export type ProductView = "profile" | "front" | "back";

export interface Department {
  slug: string;
  name: string;
  subtitle: string;
}

export interface ProductFormat {
  slug: string;
  name: string;
  displayMode: DisplayMode;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  priceUsd: number;
  compareAtUsd?: number;
  badge?: string;
  departmentSlug: string;
  formatSlug: string;
  displayMode: DisplayMode;
  kind: ProductKind;
  motif: Motif;
  printText: string;
  featured: boolean;
  customizable: boolean;
  colors: ProductColor[];
  images: Partial<Record<ProductView, string>>;
}

export interface HeroSlide {
  id: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  poster?: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
}

export interface Catalog {
  departments: Department[];
  formats: ProductFormat[];
  products: Product[];
  slides: HeroSlide[];
  source: "supabase" | "demo";
}

const WHITE = { name: "Blanco", hex: "#FFFFFF" };
const CREAM = { name: "Crema", hex: "#EFE7D2" };
const CHARCOAL = { name: "Carbón", hex: "#2B2B2B" };
const FOREST = { name: "Verde bosque", hex: "#1E4D24" };
const ALL = [WHITE, CREAM, CHARCOAL, FOREST];

export const DEMO_DEPARTMENTS: Department[] = [
  { slug: "destacados", name: "Destacados", subtitle: "Lo más querido de la casa" },
  { slug: "frenchies", name: "Frenchies", subtitle: "Para los dueños de bulldogs franceses" },
  { slug: "perros", name: "Perros", subtitle: "Moda para tu mejor amigo" },
  { slug: "gatos", name: "Gatos", subtitle: "Elegancia felina" },
  { slug: "exoticos", name: "Exóticos", subtitle: "Mascotas fuera de lo común" },
  { slug: "navidad-peluda", name: "Navidad Peluda", subtitle: "Edición festiva" },
];

export const DEMO_FORMATS: ProductFormat[] = [
  { slug: "todo", name: "Todo", displayMode: "rack" },
  { slug: "franelas", name: "Franelas", displayMode: "rack" },
  { slug: "hoodies", name: "Hoodies", displayMode: "rack" },
  { slug: "gorras", name: "Gorras", displayMode: "shelf" },
  { slug: "tazas-coolers", name: "Tazas y Coolers", displayMode: "shelf" },
];

type Seed = Omit<Product, "id" | "images" | "displayMode"> & { id?: string };

const seeds: Seed[] = [
  { slug: "franela-huella-esencial", name: "Franela Huella Esencial", priceUsd: 24, badge: "NUEVO", departmentSlug: "perros", formatSlug: "franelas", kind: "tee", motif: "paw", printText: "SO GUAU", featured: true, customizable: false, colors: ALL },
  { slug: "franela-frenchie-club", name: "Franela Frenchie Club", priceUsd: 26, badge: "PERSONALIZABLE", departmentSlug: "frenchies", formatSlug: "franelas", kind: "tee", motif: "frenchie", printText: "FRENCHIE CLUB", featured: true, customizable: true, colors: [CREAM, WHITE, CHARCOAL, FOREST] },
  { slug: "franela-cat-mom", name: "Franela Cat Mom", priceUsd: 25, departmentSlug: "gatos", formatSlug: "franelas", kind: "tee", motif: "cat", printText: "CAT MOM", featured: false, customizable: true, colors: [CHARCOAL, WHITE, CREAM, FOREST] },
  { slug: "torre-de-frenchies", name: "Torre de Frenchies", priceUsd: 28, badge: "PERSONALIZABLE", departmentSlug: "frenchies", formatSlug: "franelas", kind: "tee", motif: "tower", printText: "TORRE", featured: true, customizable: true, colors: [WHITE, CREAM, CHARCOAL, FOREST] },
  { slug: "franela-exotica-huella", name: "Franela Exóticos Club", priceUsd: 27, departmentSlug: "exoticos", formatSlug: "franelas", kind: "tee", motif: "text", printText: "EXÓTICO", featured: false, customizable: true, colors: [FOREST, CREAM, WHITE, CHARCOAL] },
  { slug: "hoodie-gema-frenchie", name: "Hoodie GEMA Frenchie", priceUsd: 52, badge: "PERSONALIZABLE", departmentSlug: "frenchies", formatSlug: "hoodies", kind: "hoodie", motif: "frenchie", printText: "GEMA", featured: true, customizable: true, colors: [FOREST, CREAM, CHARCOAL, WHITE] },
  { slug: "hoodie-gema-retrato", name: "Hoodie GEMA Retrato", priceUsd: 55, badge: "NUEVO", departmentSlug: "perros", formatSlug: "hoodies", kind: "hoodie", motif: "paw", printText: "GEMA", featured: false, customizable: true, colors: [CHARCOAL, CREAM, FOREST, WHITE] },
  { slug: "hoodie-navidad-peluda", name: "Hoodie Navidad Peluda", priceUsd: 48, compareAtUsd: 56.5, badge: "-15%", departmentSlug: "navidad-peluda", formatSlug: "hoodies", kind: "hoodie", motif: "tree", printText: "FELIZ NAVIDAD", featured: false, customizable: false, colors: [CREAM, FOREST, CHARCOAL, WHITE] },
  { slug: "gorra-so-guau", name: "Gorra So Guau", priceUsd: 19, departmentSlug: "perros", formatSlug: "gorras", kind: "cap", motif: "text", printText: "SO GUAU", featured: true, customizable: false, colors: [CHARCOAL, CREAM, FOREST, WHITE] },
  { slug: "gorra-frenchie", name: "Gorra Frenchie", priceUsd: 20, badge: "NUEVO", departmentSlug: "frenchies", formatSlug: "gorras", kind: "cap", motif: "frenchie", printText: "FRENCHIE", featured: false, customizable: true, colors: [CREAM, CHARCOAL, FOREST, WHITE] },
  { slug: "taza-cat-mom", name: "Taza Cat Mom", priceUsd: 14, badge: "PERSONALIZABLE", departmentSlug: "gatos", formatSlug: "tazas-coolers", kind: "mug", motif: "cat", printText: "CAT MOM", featured: false, customizable: true, colors: [WHITE, CREAM, CHARCOAL, FOREST] },
  { slug: "cooler-frenchie", name: "Cooler Frenchie", priceUsd: 22, badge: "NUEVO", departmentSlug: "frenchies", formatSlug: "tazas-coolers", kind: "cooler", motif: "frenchie", printText: "FRENCHIE", featured: true, customizable: true, colors: [FOREST, CREAM, CHARCOAL, WHITE] },
  { slug: "taza-navidad-peluda", name: "Taza Navidad Peluda", priceUsd: 12.75, compareAtUsd: 15, badge: "-15%", departmentSlug: "navidad-peluda", formatSlug: "tazas-coolers", kind: "mug", motif: "tree", printText: "NAVIDAD", featured: false, customizable: false, colors: [CREAM, WHITE, FOREST, CHARCOAL] },
];

export const DEMO_PRODUCTS: Product[] = seeds.map((s, i) => ({
  ...s,
  id: `demo-${i + 1}`,
  displayMode: DEMO_FORMATS.find((f) => f.slug === s.formatSlug)?.displayMode ?? "rack",
  images: {},
}));

export const DEMO_SLIDES: HeroSlide[] = [
  { id: "s1", mediaType: "image", mediaUrl: "/hero/hero-1.svg", title: "Moda que deja huellas", subtitle: "Franelas y hoodies de algodón pensados para ti y tu mejor amigo.", ctaText: "Ver colección", ctaLink: "/tienda" },
  { id: "s2", mediaType: "video", mediaUrl: "/hero/taller.mp4", poster: "/hero/hero-2.svg", title: "Hecho a mano en el taller", subtitle: "Cada pieza se estampa y se revisa una por una, con cariño.", ctaText: "Conocer el taller", ctaLink: "/taller" },
  { id: "s3", mediaType: "image", mediaUrl: "/hero/hero-3.svg", title: "Navidad Peluda", subtitle: "Hoodies y tazas festivas con -15% por tiempo limitado.", ctaText: "Ver edición festiva", ctaLink: "/tienda?dept=navidad-peluda" },
];

export function hasSupabaseCredentials() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && /^https?:\/\//.test(url) && !/localhost|tu-proyecto|your-|xxxx/i.test(url) && key.length > 20 && !/anon-key|your-|tu-/i.test(key));
}

type Row = Record<string, unknown>;
const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);

function inferKind(formatSlug: string): ProductKind {
  if (formatSlug.includes("hood")) return "hoodie";
  if (formatSlug.includes("gorra")) return "cap";
  if (formatSlug.includes("taza")) return "mug";
  if (formatSlug.includes("cooler")) return "cooler";
  return "tee";
}

function parseColors(v: unknown): ProductColor[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((c): ProductColor | null => {
      if (typeof c === "string") return { name: c, hex: c };
      if (c && typeof c === "object") {
        const o = c as Row;
        const hex = str(o.hex) || str(o.color);
        return hex ? { name: str(o.nombre) || str(o.name) || hex, hex } : null;
      }
      return null;
    })
    .filter((c): c is ProductColor => c !== null);
}

async function fetchFromSupabase(): Promise<Catalog | null> {
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const [deps, fmts, prods, slides] = await Promise.all([
    client.from("departments").select("*").order("orden"),
    client.from("product_formats").select("*").order("orden"),
    client.from("products").select("*, departments(slug), product_formats(slug, display_mode)").order("created_at", { ascending: false }),
    client.from("hero_slides").select("*").order("orden"),
  ]);
  if (deps.error || fmts.error || prods.error || slides.error) return null;
  if (!prods.data?.length || !fmts.data?.length) return null;

  const departments: Department[] = [
    DEMO_DEPARTMENTS[0],
    ...(deps.data as Row[]).map((d) => ({ slug: str(d.slug), name: str(d.nombre), subtitle: str(d.subtitulo) })),
  ];
  const formats: ProductFormat[] = [
    DEMO_FORMATS[0],
    ...(fmts.data as Row[]).map((f) => ({ slug: str(f.slug), name: str(f.nombre), displayMode: (f.display_mode === "shelf" ? "shelf" : "rack") as DisplayMode })),
  ];
  const products: Product[] = (prods.data as Row[]).map((p) => {
    const fmt = (p.product_formats ?? {}) as Row;
    const dep = (p.departments ?? {}) as Row;
    const formatSlug = str(fmt.slug);
    const colors = parseColors(p.colores_json);
    const demo = DEMO_PRODUCTS.find((d) => d.formatSlug === formatSlug);
    return {
      id: str(p.id),
      slug: str(p.id),
      name: str(p.nombre),
      priceUsd: Number(p.precio_usd) || 0,
      badge: str(p.badge) || undefined,
      departmentSlug: str(dep.slug),
      formatSlug,
      displayMode: fmt.display_mode === "shelf" ? "shelf" : "rack",
      kind: demo?.kind ?? inferKind(formatSlug),
      motif: "paw",
      printText: "SO GUAU",
      featured: Boolean(p.badge),
      customizable: Boolean(p.es_personalizable),
      colors: colors.length ? colors : ALL,
      images: {
        ...(p.foto_perfil_url ? { profile: str(p.foto_perfil_url) } : {}),
        ...(p.foto_frente_url ? { front: str(p.foto_frente_url) } : {}),
        ...(p.foto_espalda_url ? { back: str(p.foto_espalda_url) } : {}),
      },
    };
  });
  const heroes: HeroSlide[] = (slides.data as Row[]).map((s) => ({
    id: str(s.id),
    mediaType: s.media_type === "video" ? "video" : "image",
    mediaUrl: str(s.media_url),
    title: str(s.titulo),
    subtitle: str(s.subtitulo),
    ctaText: str(s.cta_texto, "Ver más"),
    ctaLink: str(s.cta_link, "/tienda"),
  }));
  return {
    departments,
    formats,
    products,
    slides: heroes.length ? heroes : DEMO_SLIDES,
    source: "supabase",
  };
}

export async function getCatalog(): Promise<Catalog> {
  "use cache";
  cacheLife("minutes");
  const demo: Catalog = { departments: DEMO_DEPARTMENTS, formats: DEMO_FORMATS, products: DEMO_PRODUCTS, slides: DEMO_SLIDES, source: "demo" };
  if (!hasSupabaseCredentials()) return demo;
  try {
    const result = await Promise.race([
      fetchFromSupabase(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);
    return result ?? demo;
  } catch {
    return demo;
  }
}
