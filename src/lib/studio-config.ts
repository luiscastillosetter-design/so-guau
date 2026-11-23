// Constantes puras del Estudio (seguras para cliente y servidor).
import type { ProductKind } from "@/lib/catalog";

export const FREE_TRIES = 2;
export const WINDOW_MS = 24 * 60 * 60 * 1000;
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

export type TemplateMode = "gema" | "torre" | "editorial" | "libre";

export interface StudioTemplate {
  slug: string;
  name: string;
  tagline: string;
  mode: TemplateMode;
  maxPhotos: number;
  promptSystem: string;
}

export const FALLBACK_TEMPLATES: StudioTemplate[] = [
  {
    slug: "estilo-gema",
    name: "Estilo GEMA",
    tagline: "Mitad nombre + mitad rostro",
    mode: "gema",
    maxPhotos: 1,
    promptSystem:
      "Create a stylized split-portrait print: the left half of the pet face rendered as a clean illustration and the pet name in tall vertical uppercase letters merged with it. Keep the exact species, markings and colors of the pet in the photo.",
  },
  {
    slug: "torre-de-mascotas",
    name: "Torre de Mascotas",
    tagline: "Less people, more dogs",
    mode: "torre",
    maxPhotos: 3,
    promptSystem:
      "Create a clean illustrated vertical stack (tower) of the pets from the photos, one on top of another, in a modern flat illustration style. Keep the exact species, markings and colors of each pet. Optional short text above or below.",
  },
  {
    slug: "editorial-pet-parent",
    name: "Editorial Pet Parent",
    tagline: "Cat Mom / Dog Dad en alto contraste",
    mode: "editorial",
    maxPhotos: 1,
    promptSystem:
      "Create a high-contrast editorial graphic of the pet in the photo with large repeated background typography and the custom text prominently integrated. Keep the exact species and markings of the pet.",
  },
  {
    slug: "diseno-libre",
    name: "Diseño Libre DTF",
    tagline: "Sube tu propia imagen o logo",
    mode: "libre",
    maxPhotos: 1,
    promptSystem:
      "Clean up the uploaded image or logo for DTF printing: isolate the subject, sharpen edges and keep the original design and colors faithful without adding new elements.",
  },
];

export const GARMENTS: { kind: ProductKind; label: string; apparel: boolean }[] = [
  { kind: "tee", label: "Franela Algodón", apparel: true },
  { kind: "hoodie", label: "Hoodie", apparel: true },
  { kind: "cap", label: "Gorra", apparel: false },
  { kind: "mug", label: "Taza", apparel: false },
  { kind: "cooler", label: "Cooler", apparel: false },
];

export type PositionId = "pecho" | "corazon" | "espalda";
export const POSITIONS: { id: PositionId; label: string }[] = [
  { id: "pecho", label: "Pecho completo" },
  { id: "corazon", label: "Corazón / Logo" },
  { id: "espalda", label: "Espalda grande" },
];
