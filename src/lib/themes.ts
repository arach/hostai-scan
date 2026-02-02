// Theme configuration for GetHost.AI admin
// Each theme has light and dark variants

export interface ThemeColors {
  // Core
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;

  // Muted
  muted: string;
  mutedForeground: string;

  // Primary & Accent
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;

  // Secondary
  secondary: string;
  secondaryForeground: string;

  // Borders
  border: string;
  input: string;
  ring: string;

  // Status (shared across themes)
  success: string;
  warning: string;
  error: string;

  // Charts
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  light: ThemeColors;
  dark: ThemeColors;
}

export interface FontConfig {
  id: string;
  name: string;
  sans: string;
  mono: string;
  description: string;
}

// ============================================================================
// Font Presets
// ============================================================================

export const FONT_PRESETS: FontConfig[] = [
  {
    id: "system",
    name: "System",
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
    description: "Native system fonts",
  },
  {
    id: "geist",
    name: "Geist",
    sans: "var(--font-geist-sans), system-ui, sans-serif",
    mono: "var(--font-geist-mono), ui-monospace, monospace",
    description: "Vercel's modern typeface",
  },
  {
    id: "inter",
    name: "Inter",
    sans: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
    description: "Clean and readable",
  },
  {
    id: "mono",
    name: "Monospace",
    sans: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",
    mono: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",
    description: "Developer-focused",
  },
];

// ============================================================================
// Color Theme Presets
// ============================================================================

export const THEME_PRESETS: ThemeConfig[] = [
  // Default - Purple/Gold (current)
  {
    id: "default",
    name: "Default",
    description: "Purple & Gold",
    light: {
      background: "210 20% 98%",
      foreground: "222 47% 11%",
      card: "0 0% 100%",
      cardForeground: "222 47% 11%",
      muted: "210 20% 94%",
      mutedForeground: "215 16% 47%",
      primary: "243 66% 55%",
      primaryForeground: "0 0% 100%",
      secondary: "210 20% 96%",
      secondaryForeground: "222 47% 11%",
      accent: "243 66% 55%",
      accentForeground: "0 0% 100%",
      border: "214 20% 88%",
      input: "214 20% 88%",
      ring: "243 66% 55%",
      success: "142 76% 36%",
      warning: "38 92% 50%",
      error: "0 72% 51%",
      chart1: "243 66% 55%",
      chart2: "142 76% 36%",
      chart3: "0 72% 51%",
      chart4: "217 91% 60%",
      chart5: "280 65% 60%",
    },
    dark: {
      background: "222 47% 8%",
      foreground: "210 40% 98%",
      card: "222 47% 11%",
      cardForeground: "210 40% 98%",
      muted: "217 33% 17%",
      mutedForeground: "215 20% 70%",
      primary: "243 66% 65%",
      primaryForeground: "0 0% 100%",
      secondary: "217 33% 20%",
      secondaryForeground: "210 40% 98%",
      accent: "243 66% 65%",
      accentForeground: "0 0% 100%",
      border: "217 33% 22%",
      input: "217 33% 22%",
      ring: "243 66% 65%",
      success: "142 70% 50%",
      warning: "38 92% 55%",
      error: "0 72% 55%",
      chart1: "243 66% 65%",
      chart2: "142 70% 50%",
      chart3: "0 72% 55%",
      chart4: "217 91% 65%",
      chart5: "280 65% 65%",
    },
  },

  // Ocean - Blues & Teals
  {
    id: "ocean",
    name: "Ocean",
    description: "Blues & Teals",
    light: {
      background: "200 20% 98%",
      foreground: "210 50% 10%",
      card: "0 0% 100%",
      cardForeground: "210 50% 10%",
      muted: "200 20% 94%",
      mutedForeground: "200 15% 45%",
      primary: "199 89% 48%",
      primaryForeground: "0 0% 100%",
      secondary: "200 20% 96%",
      secondaryForeground: "210 50% 10%",
      accent: "174 72% 40%",
      accentForeground: "0 0% 100%",
      border: "200 20% 88%",
      input: "200 20% 88%",
      ring: "199 89% 48%",
      success: "142 76% 36%",
      warning: "38 92% 50%",
      error: "0 72% 51%",
      chart1: "199 89% 48%",
      chart2: "174 72% 40%",
      chart3: "142 76% 36%",
      chart4: "220 70% 55%",
      chart5: "190 80% 45%",
    },
    dark: {
      background: "210 50% 6%",
      foreground: "200 30% 96%",
      card: "210 50% 9%",
      cardForeground: "200 30% 96%",
      muted: "210 40% 15%",
      mutedForeground: "200 20% 55%",
      primary: "199 89% 55%",
      primaryForeground: "210 50% 6%",
      secondary: "210 40% 17%",
      secondaryForeground: "200 30% 96%",
      accent: "174 72% 50%",
      accentForeground: "210 50% 6%",
      border: "210 40% 17%",
      input: "210 40% 17%",
      ring: "199 89% 55%",
      success: "142 70% 45%",
      warning: "38 92% 50%",
      error: "0 72% 51%",
      chart1: "199 89% 55%",
      chart2: "174 72% 50%",
      chart3: "142 70% 45%",
      chart4: "220 70% 60%",
      chart5: "190 80% 50%",
    },
  },

  // Forest - Greens
  {
    id: "forest",
    name: "Forest",
    description: "Greens & Earth",
    light: {
      background: "140 15% 98%",
      foreground: "150 40% 10%",
      card: "0 0% 100%",
      cardForeground: "150 40% 10%",
      muted: "140 15% 94%",
      mutedForeground: "150 15% 45%",
      primary: "142 76% 36%",
      primaryForeground: "0 0% 100%",
      secondary: "140 15% 96%",
      secondaryForeground: "150 40% 10%",
      accent: "84 60% 40%",
      accentForeground: "0 0% 100%",
      border: "140 15% 88%",
      input: "140 15% 88%",
      ring: "142 76% 36%",
      success: "142 76% 36%",
      warning: "38 92% 50%",
      error: "0 72% 51%",
      chart1: "142 76% 36%",
      chart2: "84 60% 40%",
      chart3: "30 60% 45%",
      chart4: "160 70% 35%",
      chart5: "120 50% 40%",
    },
    dark: {
      background: "150 40% 5%",
      foreground: "140 20% 96%",
      card: "150 40% 8%",
      cardForeground: "140 20% 96%",
      muted: "150 30% 14%",
      mutedForeground: "140 15% 55%",
      primary: "142 70% 45%",
      primaryForeground: "150 40% 5%",
      secondary: "150 30% 16%",
      secondaryForeground: "140 20% 96%",
      accent: "84 60% 50%",
      accentForeground: "150 40% 5%",
      border: "150 30% 16%",
      input: "150 30% 16%",
      ring: "142 70% 45%",
      success: "142 70% 45%",
      warning: "38 92% 50%",
      error: "0 72% 51%",
      chart1: "142 70% 45%",
      chart2: "84 60% 50%",
      chart3: "30 60% 50%",
      chart4: "160 70% 45%",
      chart5: "120 50% 50%",
    },
  },

  // Rose - Pinks & Roses
  {
    id: "rose",
    name: "Rose",
    description: "Pinks & Roses",
    light: {
      background: "350 20% 98%",
      foreground: "340 30% 12%",
      card: "0 0% 100%",
      cardForeground: "340 30% 12%",
      muted: "350 15% 94%",
      mutedForeground: "340 15% 47%",
      primary: "346 77% 50%",
      primaryForeground: "0 0% 100%",
      secondary: "350 15% 96%",
      secondaryForeground: "340 30% 12%",
      accent: "330 65% 55%",
      accentForeground: "0 0% 100%",
      border: "350 15% 88%",
      input: "350 15% 88%",
      ring: "346 77% 50%",
      success: "142 76% 36%",
      warning: "38 92% 50%",
      error: "0 72% 51%",
      chart1: "346 77% 50%",
      chart2: "330 65% 55%",
      chart3: "300 60% 50%",
      chart4: "360 70% 60%",
      chart5: "320 70% 55%",
    },
    dark: {
      background: "340 30% 6%",
      foreground: "350 20% 96%",
      card: "340 30% 9%",
      cardForeground: "350 20% 96%",
      muted: "340 25% 15%",
      mutedForeground: "350 15% 55%",
      primary: "346 77% 60%",
      primaryForeground: "340 30% 6%",
      secondary: "340 25% 17%",
      secondaryForeground: "350 20% 96%",
      accent: "330 65% 60%",
      accentForeground: "340 30% 6%",
      border: "340 25% 17%",
      input: "340 25% 17%",
      ring: "346 77% 60%",
      success: "142 70% 45%",
      warning: "38 92% 50%",
      error: "0 72% 51%",
      chart1: "346 77% 60%",
      chart2: "330 65% 60%",
      chart3: "300 60% 55%",
      chart4: "360 70% 65%",
      chart5: "320 70% 60%",
    },
  },

  // Mono - Grayscale
  {
    id: "mono",
    name: "Mono",
    description: "Clean Grayscale",
    light: {
      background: "0 0% 98%",
      foreground: "0 0% 9%",
      card: "0 0% 100%",
      cardForeground: "0 0% 9%",
      muted: "0 0% 94%",
      mutedForeground: "0 0% 45%",
      primary: "0 0% 15%",
      primaryForeground: "0 0% 100%",
      secondary: "0 0% 96%",
      secondaryForeground: "0 0% 9%",
      accent: "0 0% 25%",
      accentForeground: "0 0% 100%",
      border: "0 0% 88%",
      input: "0 0% 88%",
      ring: "0 0% 15%",
      success: "142 76% 36%",
      warning: "38 92% 50%",
      error: "0 72% 51%",
      chart1: "0 0% 15%",
      chart2: "0 0% 35%",
      chart3: "0 0% 55%",
      chart4: "0 0% 45%",
      chart5: "0 0% 25%",
    },
    dark: {
      background: "0 0% 6%",
      foreground: "0 0% 96%",
      card: "0 0% 9%",
      cardForeground: "0 0% 96%",
      muted: "0 0% 15%",
      mutedForeground: "0 0% 55%",
      primary: "0 0% 95%",
      primaryForeground: "0 0% 6%",
      secondary: "0 0% 17%",
      secondaryForeground: "0 0% 96%",
      accent: "0 0% 85%",
      accentForeground: "0 0% 6%",
      border: "0 0% 17%",
      input: "0 0% 17%",
      ring: "0 0% 95%",
      success: "142 70% 45%",
      warning: "38 92% 50%",
      error: "0 72% 51%",
      chart1: "0 0% 95%",
      chart2: "0 0% 75%",
      chart3: "0 0% 55%",
      chart4: "0 0% 65%",
      chart5: "0 0% 85%",
    },
  },

  // Sunset - Oranges & Reds
  {
    id: "sunset",
    name: "Sunset",
    description: "Oranges & Reds",
    light: {
      background: "30 20% 98%",
      foreground: "20 40% 12%",
      card: "0 0% 100%",
      cardForeground: "20 40% 12%",
      muted: "30 15% 94%",
      mutedForeground: "20 15% 47%",
      primary: "25 95% 53%",
      primaryForeground: "0 0% 100%",
      secondary: "30 15% 96%",
      secondaryForeground: "20 40% 12%",
      accent: "12 76% 52%",
      accentForeground: "0 0% 100%",
      border: "30 15% 88%",
      input: "30 15% 88%",
      ring: "25 95% 53%",
      success: "142 76% 36%",
      warning: "38 92% 50%",
      error: "0 72% 51%",
      chart1: "25 95% 53%",
      chart2: "12 76% 52%",
      chart3: "38 92% 50%",
      chart4: "45 93% 47%",
      chart5: "0 72% 51%",
    },
    dark: {
      background: "20 40% 6%",
      foreground: "30 20% 96%",
      card: "20 40% 9%",
      cardForeground: "30 20% 96%",
      muted: "20 30% 15%",
      mutedForeground: "30 15% 55%",
      primary: "25 95% 60%",
      primaryForeground: "20 40% 6%",
      secondary: "20 30% 17%",
      secondaryForeground: "30 20% 96%",
      accent: "12 76% 58%",
      accentForeground: "20 40% 6%",
      border: "20 30% 17%",
      input: "20 30% 17%",
      ring: "25 95% 60%",
      success: "142 70% 45%",
      warning: "38 92% 50%",
      error: "0 72% 51%",
      chart1: "25 95% 60%",
      chart2: "12 76% 58%",
      chart3: "38 92% 55%",
      chart4: "45 93% 52%",
      chart5: "0 72% 55%",
    },
  },
];

// ============================================================================
// Theme Utilities
// ============================================================================

export function getThemeById(id: string): ThemeConfig | undefined {
  return THEME_PRESETS.find((t) => t.id === id);
}

export function getFontById(id: string): FontConfig | undefined {
  return FONT_PRESETS.find((f) => f.id === id);
}

export function applyTheme(theme: ThemeConfig, mode: "light" | "dark") {
  const colors = mode === "dark" ? theme.dark : theme.light;
  const root = document.documentElement;

  // Apply colors
  root.style.setProperty("--background", `hsl(${colors.background})`);
  root.style.setProperty("--foreground", `hsl(${colors.foreground})`);
  root.style.setProperty("--card", `hsl(${colors.card})`);
  root.style.setProperty("--card-foreground", `hsl(${colors.cardForeground})`);
  root.style.setProperty("--muted", `hsl(${colors.muted})`);
  root.style.setProperty("--muted-foreground", `hsl(${colors.mutedForeground})`);
  root.style.setProperty("--primary", `hsl(${colors.primary})`);
  root.style.setProperty("--primary-foreground", `hsl(${colors.primaryForeground})`);
  root.style.setProperty("--secondary", `hsl(${colors.secondary})`);
  root.style.setProperty("--secondary-foreground", `hsl(${colors.secondaryForeground})`);
  root.style.setProperty("--accent", `hsl(${colors.accent})`);
  root.style.setProperty("--accent-foreground", `hsl(${colors.accentForeground})`);
  root.style.setProperty("--border", `hsl(${colors.border})`);
  root.style.setProperty("--input", `hsl(${colors.input})`);
  root.style.setProperty("--ring", `hsl(${colors.ring})`);
  root.style.setProperty("--success", `hsl(${colors.success})`);
  root.style.setProperty("--warning", `hsl(${colors.warning})`);
  root.style.setProperty("--error", `hsl(${colors.error})`);
  root.style.setProperty("--chart-1", `hsl(${colors.chart1})`);
  root.style.setProperty("--chart-2", `hsl(${colors.chart2})`);
  root.style.setProperty("--chart-3", `hsl(${colors.chart3})`);
  root.style.setProperty("--chart-4", `hsl(${colors.chart4})`);
  root.style.setProperty("--chart-5", `hsl(${colors.chart5})`);

  // Sync fumadocs theme variables
  root.style.setProperty("--color-fd-background", `hsl(${colors.background})`);
  root.style.setProperty("--color-fd-foreground", `hsl(${colors.foreground})`);
  root.style.setProperty("--color-fd-muted", `hsl(${colors.muted})`);
  root.style.setProperty("--color-fd-muted-foreground", `hsl(${colors.mutedForeground})`);
  root.style.setProperty("--color-fd-border", `hsl(${colors.border})`);
  root.style.setProperty("--color-fd-primary", `hsl(${colors.primary})`);
  root.style.setProperty("--color-fd-primary-foreground", `hsl(${colors.primaryForeground})`);
  root.style.setProperty("--color-fd-secondary", `hsl(${colors.secondary})`);
  root.style.setProperty("--color-fd-secondary-foreground", `hsl(${colors.secondaryForeground})`);
  root.style.setProperty("--color-fd-accent", `hsl(${colors.accent})`);
  root.style.setProperty("--color-fd-accent-foreground", `hsl(${colors.accentForeground})`);
  root.style.setProperty("--color-fd-card", `hsl(${colors.card})`);
  root.style.setProperty("--color-fd-card-foreground", `hsl(${colors.cardForeground})`);

  // Apply dark mode class
  if (mode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function applyFont(font: FontConfig) {
  const root = document.documentElement;
  root.style.setProperty("--font-sans", font.sans);
  root.style.setProperty("--font-mono", font.mono);
  document.body.style.fontFamily = font.sans;
}

// Storage keys
export const STORAGE_KEYS = {
  theme: "gethost-theme",
  mode: "gethost-mode",
  font: "gethost-font",
} as const;

export function loadSavedPreferences(): {
  themeId: string;
  mode: "light" | "dark";
  fontId: string;
} {
  if (typeof window === "undefined") {
    return { themeId: "default", mode: "light", fontId: "system" };
  }

  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || "default";
  const savedMode = (localStorage.getItem(STORAGE_KEYS.mode) as "light" | "dark") || "light";
  const savedFont = localStorage.getItem(STORAGE_KEYS.font) || "system";

  return { themeId: savedTheme, mode: savedMode, fontId: savedFont };
}

export function savePreferences(themeId: string, mode: "light" | "dark", fontId: string) {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEYS.theme, themeId);
  localStorage.setItem(STORAGE_KEYS.mode, mode);
  localStorage.setItem(STORAGE_KEYS.font, fontId);
}
