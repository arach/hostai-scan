"use client";

import { useState } from "react";
import { useTheme } from "./theme-provider";
import { Sun, Moon, Palette, Type, Check, ChevronDown } from "lucide-react";

// ============================================================================
// Color Preview Swatch
// ============================================================================

function ColorSwatch({
  colors,
  size = "md",
}: {
  colors: { primary: string; accent: string; background: string };
  size?: "sm" | "md";
}) {
  const sizeClasses = size === "sm" ? "size-4" : "size-6";

  return (
    <div className="flex -space-x-1">
      <div
        className={`${sizeClasses} rounded-full border-2 border-background`}
        style={{ background: `hsl(${colors.primary})` }}
      />
      <div
        className={`${sizeClasses} rounded-full border-2 border-background`}
        style={{ background: `hsl(${colors.accent})` }}
      />
    </div>
  );
}

// ============================================================================
// Theme Picker Dropdown
// ============================================================================

export function ThemePicker() {
  const { theme, mode, font, setTheme, toggleMode, setFont, themes, fonts } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"colors" | "fonts">("colors");

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted border border-border/50 transition-colors"
      >
        <Palette className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">{theme.name}</span>
        <ChevronDown
          className={`size-3 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl bg-card border border-border shadow-xl overflow-hidden">
            {/* Header with Mode Toggle */}
            <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/30">
              <span className="text-sm font-medium">Appearance</span>
              <button
                onClick={toggleMode}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-background border border-border/50 hover:bg-muted transition-colors"
              >
                {mode === "light" ? (
                  <Sun className="size-4 text-warning" />
                ) : (
                  <Moon className="size-4 text-primary" />
                )}
                <span className="text-xs font-medium capitalize">{mode}</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border/50">
              <button
                onClick={() => setActiveTab("colors")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors ${
                  activeTab === "colors"
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Palette className="size-3.5" />
                Colors
              </button>
              <button
                onClick={() => setActiveTab("fonts")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors ${
                  activeTab === "fonts"
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Type className="size-3.5" />
                Fonts
              </button>
            </div>

            {/* Content */}
            <div className="p-2 max-h-[320px] overflow-y-auto">
              {activeTab === "colors" && (
                <div className="space-y-1">
                  {themes.map((t) => {
                    const isSelected = theme.id === t.id;
                    const colors = mode === "dark" ? t.dark : t.light;

                    return (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          isSelected
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-muted/50 border border-transparent"
                        }`}
                      >
                        <ColorSwatch
                          colors={{
                            primary: colors.primary,
                            accent: colors.accent,
                            background: colors.background,
                          }}
                        />
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium">{t.name}</div>
                          <div className="text-xs text-muted-foreground">{t.description}</div>
                        </div>
                        {isSelected && <Check className="size-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {activeTab === "fonts" && (
                <div className="space-y-1">
                  {fonts.map((f) => {
                    const isSelected = font.id === f.id;

                    return (
                      <button
                        key={f.id}
                        onClick={() => setFont(f.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          isSelected
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-muted/50 border border-transparent"
                        }`}
                      >
                        <div
                          className="size-8 rounded-md bg-muted flex items-center justify-center text-sm font-bold"
                          style={{ fontFamily: f.sans }}
                        >
                          Aa
                        </div>
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium">{f.name}</div>
                          <div className="text-xs text-muted-foreground">{f.description}</div>
                        </div>
                        {isSelected && <Check className="size-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Preview */}
            <div className="p-3 border-t border-border/50 bg-muted/20">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                Preview
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-8 rounded-md bg-primary flex items-center justify-center">
                  <span className="text-xs font-medium text-primary-foreground">Primary</span>
                </div>
                <div className="flex-1 h-8 rounded-md bg-accent flex items-center justify-center">
                  <span className="text-xs font-medium text-accent-foreground">Accent</span>
                </div>
                <div className="flex-1 h-8 rounded-md bg-muted flex items-center justify-center">
                  <span className="text-xs font-medium text-muted-foreground">Muted</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Compact Mode Toggle (for headers)
// ============================================================================

export function ModeToggle() {
  const { mode, toggleMode } = useTheme();

  return (
    <button
      onClick={toggleMode}
      className="size-9 rounded-lg flex items-center justify-center bg-muted/50 hover:bg-muted border border-border/50 transition-colors"
      title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
    >
      {mode === "light" ? (
        <Moon className="size-4 text-muted-foreground" />
      ) : (
        <Sun className="size-4 text-muted-foreground" />
      )}
    </button>
  );
}

// ============================================================================
// Inline Theme Selector (alternative compact view)
// ============================================================================

export function InlineThemeSelector() {
  const { theme, mode, setTheme, toggleMode, themes } = useTheme();

  return (
    <div className="flex items-center gap-2">
      {/* Color Theme Pills */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/30 border border-border/50">
        {themes.map((t) => {
          const isSelected = theme.id === t.id;
          const colors = mode === "dark" ? t.dark : t.light;

          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`size-6 rounded-md flex items-center justify-center transition-all ${
                isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : "hover:scale-110"
              }`}
              title={t.name}
            >
              <div
                className="size-4 rounded-full"
                style={{
                  background: `linear-gradient(135deg, hsl(${colors.primary}) 50%, hsl(${colors.accent}) 50%)`,
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Mode Toggle */}
      <button
        onClick={toggleMode}
        className="size-8 rounded-lg flex items-center justify-center bg-muted/30 hover:bg-muted border border-border/50 transition-colors"
        title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
      >
        {mode === "light" ? (
          <Sun className="size-4 text-warning" />
        ) : (
          <Moon className="size-4 text-primary" />
        )}
      </button>
    </div>
  );
}
