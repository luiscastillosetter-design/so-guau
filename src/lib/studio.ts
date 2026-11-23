import { createClient } from "@supabase/supabase-js";
import { cacheLife } from "next/cache";
import { hasSupabaseCredentials } from "@/lib/catalog";
import { FALLBACK_TEMPLATES, type StudioTemplate, type TemplateMode } from "@/lib/studio-config";

type Row = Record<string, unknown>;
const MODES: TemplateMode[] = ["gema", "torre", "editorial", "libre"];

export async function getTemplates(): Promise<StudioTemplate[]> {
  "use cache";
  cacheLife("minutes");
  if (!hasSupabaseCredentials()) return FALLBACK_TEMPLATES;
  try {
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
    const { data, error } = await client.from("custom_templates").select("*");
    if (error || !data?.length) return FALLBACK_TEMPLATES;
    const list: StudioTemplate[] = [];
    for (const r of data as Row[]) {
      const mode = MODES.find((m) => m === r.modo);
      const slug = typeof r.slug === "string" ? r.slug : "";
      if (!mode || !slug) continue;
      const base = FALLBACK_TEMPLATES.find((t) => t.mode === mode)!;
      list.push({
        slug,
        name: typeof r.nombre === "string" && r.nombre ? r.nombre : base.name,
        tagline: typeof r.descripcion === "string" && r.descripcion ? r.descripcion : base.tagline,
        mode,
        maxPhotos: Math.min(3, Math.max(1, Number(r.max_fotos) || base.maxPhotos)),
        promptSystem: typeof r.prompt_sistema === "string" && r.prompt_sistema ? r.prompt_sistema : base.promptSystem,
      });
    }
    return list.length ? list : FALLBACK_TEMPLATES;
  } catch {
    return FALLBACK_TEMPLATES;
  }
}
