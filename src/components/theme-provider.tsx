"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  THEME_PRESETS,
  FONT_PRESETS,
  getThemeById,
  getFontById,
  applyTheme,
  applyFont,
  loadSavedPreferences,
  savePreferences,
  type ThemeConfig,
  type FontConfig,
} from "@/lib/themes";

interface ThemeContextValue {
  // Current state
  theme: ThemeConfig;
  mode: "light" | "dark";
  font: FontConfig;

  // Setters
  setTheme: (themeId: string) => void;
  setMode: (mode: "light" | "dark") => void;
  toggleMode: () => void;
  setFont: (fontId: string) => void;

  // Lists
  themes: ThemeConfig[];
  fonts: FontConfig[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<ThemeConfig>(THEME_PRESETS[0]);
  const [mode, setModeState] = useState<"light" | "dark">("light");
  const [font, setFontState] = useState<FontConfig>(FONT_PRESETS[0]);

  // Initialize from localStorage on mount
  useEffect(() => {
    const { themeId, mode: savedMode, fontId } = loadSavedPreferences();

    const loadedTheme = getThemeById(themeId) || THEME_PRESETS[0];
    const loadedFont = getFontById(fontId) || FONT_PRESETS[0];

    setThemeState(loadedTheme);
    setModeState(savedMode);
    setFontState(loadedFont);

    // Apply immediately
    applyTheme(loadedTheme, savedMode);
    applyFont(loadedFont);

    setMounted(true);
  }, []);

  // Apply theme changes
  const setTheme = useCallback(
    (themeId: string) => {
      const newTheme = getThemeById(themeId);
      if (!newTheme) return;

      setThemeState(newTheme);
      applyTheme(newTheme, mode);
      savePreferences(themeId, mode, font.id);
    },
    [mode, font.id]
  );

  const setMode = useCallback(
    (newMode: "light" | "dark") => {
      setModeState(newMode);
      applyTheme(theme, newMode);
      savePreferences(theme.id, newMode, font.id);
    },
    [theme, font.id]
  );

  const toggleMode = useCallback(() => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
  }, [mode, setMode]);

  const setFont = useCallback(
    (fontId: string) => {
      const newFont = getFontById(fontId);
      if (!newFont) return;

      setFontState(newFont);
      applyFont(newFont);
      savePreferences(theme.id, mode, fontId);
    },
    [theme.id, mode]
  );

  // Prevent flash of unstyled content
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        mode,
        font,
        setTheme,
        setMode,
        toggleMode,
        setFont,
        themes: THEME_PRESETS,
        fonts: FONT_PRESETS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
