export type ThemeKey = "so-guau" | "sand-navy" | "obsidian-gold" | "offwhite-forest";

export interface Theme {
  key: ThemeKey;
  name: string;
  background: string;
  primary: string;
  accent: string;
  text: string;
  onPrimary: string;
}

export const THEMES: Record<ThemeKey, Theme> = {
  "so-guau": { key: "so-guau", name: "So Guau", background: "#F8F5EA", primary: "#1E4D24", accent: "#F991C3", text: "#142616", onPrimary: "#F8F5EA" },
  "sand-navy": { key: "sand-navy", name: "Sand & Navy", background: "#EFE6D5", primary: "#14213D", accent: "#E0A458", text: "#0D1526", onPrimary: "#EFE6D5" },
  "obsidian-gold": { key: "obsidian-gold", name: "Obsidian & Gold", background: "#0E0E10", primary: "#C9A227", accent: "#E8D48B", text: "#F2EDE0", onPrimary: "#0E0E10" },
  "offwhite-forest": { key: "offwhite-forest", name: "Offwhite & Forest", background: "#FAFAF7", primary: "#2F4F3A", accent: "#B7C9A8", text: "#1A241D", onPrimary: "#FAFAF7" },
};

export const DEFAULT_THEME: ThemeKey = "so-guau";

export function getTheme(key?: string | null): Theme {
  return THEMES[key as ThemeKey] ?? THEMES[DEFAULT_THEME];
}

export function themeToCssVars(theme: Theme): Record<string, string> {
  return {
    "--brand-bg": theme.background,
    "--brand-primary": theme.primary,
    "--brand-accent": theme.accent,
    "--brand-text": theme.text,
    "--brand-on-primary": theme.onPrimary,
  };
}
