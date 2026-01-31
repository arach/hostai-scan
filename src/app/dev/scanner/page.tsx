"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { MultiPhaseScanner, DEFAULT_PHASES } from "@/components/scanner"
import type { AuditPhase } from "@/components/scanner"
import {
  Play,
  Pause,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  SkipBack,
  SkipForward,
  Sun,
  Moon,
  Settings2,
  RotateCw,
  Copy,
  Check,
  ClipboardPaste,
  Save,
} from "lucide-react"

const STORAGE_KEY = "gethostai-scanner-custom-phases"

export default function ScannerDevPage() {
  // Scanner state
  const [currentPhase, setCurrentPhase] = useState(0)
  const [phaseProgress, setPhaseProgress] = useState(0)
  const [overallProgress, setOverallProgress] = useState(0)

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1) // 1x, 2x, 4x

  // UI state
  const [isPanelMinimized, setIsPanelMinimized] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [accentColor, setAccentColor] = useState<string | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [copiedExport, setCopiedExport] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  // Custom phase items - stored as comma-separated strings per phase
  const [customPhaseItems, setCustomPhaseItems] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {}
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : {}
  })

  // Load saved config from source file on mount
  useEffect(() => {
    fetch("/api/dev/scanner-config")
      .then(res => res.json())
      .then(data => {
        if (data.phases) {
          const items: Record<string, string> = {}
          for (const phase of data.phases) {
            if (phase.id && Array.isArray(phase.items)) {
              items[phase.id] = phase.items.join(", ")
            }
          }
          setCustomPhaseItems(items)
        }
      })
      .catch(() => {
        // Fall back to localStorage or defaults
      })
  }, [])

  // Build custom phases from edited items
  const customPhases = useMemo((): AuditPhase[] => {
    return DEFAULT_PHASES.map(phase => {
      const customItems = customPhaseItems[phase.id]
      if (customItems && customItems.trim()) {
        const items = customItems
          .split(",")
          .map(s => s.trim())
          .filter(s => s.length > 0)
        return { ...phase, items }
      }
      return phase
    })
  }, [customPhaseItems])

  // Save to localStorage when custom items change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customPhaseItems))
    }
  }, [customPhaseItems])

  const handlePhaseItemsChange = (phaseId: string, value: string) => {
    setCustomPhaseItems(prev => ({ ...prev, [phaseId]: value }))
  }

  const handleResetPhase = (phaseId: string) => {
    setCustomPhaseItems(prev => {
      const next = { ...prev }
      delete next[phaseId]
      return next
    })
  }

  const handleResetAll = () => {
    setCustomPhaseItems({})
  }

  const handleExportConfig = async () => {
    const config = customPhases.map(p => ({
      id: p.id,
      name: p.name,
      items: p.items,
    }))
    await navigator.clipboard.writeText(JSON.stringify(config, null, 2))
    setCopiedExport(true)
    setTimeout(() => setCopiedExport(false), 2000)
  }

  const handleImportConfig = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const config = JSON.parse(text)

      if (!Array.isArray(config)) {
        alert("Invalid format: expected an array of phases")
        return
      }

      const newCustomItems: Record<string, string> = {}
      for (const phase of config) {
        if (phase.id && Array.isArray(phase.items)) {
          newCustomItems[phase.id] = phase.items.join(", ")
        }
      }

      setCustomPhaseItems(newCustomItems)
    } catch (err) {
      alert("Failed to import: " + (err instanceof Error ? err.message : "Invalid JSON"))
    }
  }

  const handleSaveToSource = async () => {
    setSaveStatus("saving")
    try {
      const config = {
        phases: customPhases.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          items: p.items,
        }))
      }

      const res = await fetch("/api/dev/scanner-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      if (!res.ok) {
        throw new Error("Failed to save")
      }

      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } catch (err) {
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 3000)
    }
  }

  // Accent color presets
  const accentPresets = [
    { name: "Purple", value: "243 66% 55%", hex: "#5753c6" },
    { name: "Blue", value: "217 91% 60%", hex: "#2563eb" },
    { name: "Teal", value: "168 76% 42%", hex: "#0d9488" },
    { name: "Indigo", value: "239 84% 67%", hex: "#4f46e5" },
    { name: "Emerald", value: "160 84% 39%", hex: "#059669" },
    { name: "Amber", value: "38 92% 50%", hex: "#f59e0b" },
  ]

  // Apply dark mode to document root for proper CSS variable inheritance
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    // Cleanup on unmount
    return () => {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  // Apply custom accent color
  useEffect(() => {
    if (accentColor) {
      document.documentElement.style.setProperty("--accent", `hsl(${accentColor})`)
    } else {
      document.documentElement.style.removeProperty("--accent")
    }
    // Cleanup on unmount
    return () => {
      document.documentElement.style.removeProperty("--accent")
    }
  }, [accentColor])

  // Calculate overall progress from phase and phase progress
  const calculateOverall = useCallback((phase: number, progress: number) => {
    const phaseWeight = 100 / customPhases.length
    return Math.round((phase * phaseWeight) + (progress * phaseWeight / 100))
  }, [])

  // Auto-play logic
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setPhaseProgress(prev => {
        const increment = 2 * speed
        const newProgress = prev + increment

        if (newProgress >= 100) {
          // Move to next phase
          setCurrentPhase(p => {
            if (p >= customPhases.length - 1) {
              setIsPlaying(false)
              return p
            }
            return p + 1
          })
          return 0
        }
        return newProgress
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isPlaying, speed])

  // Update overall progress when phase/progress changes
  useEffect(() => {
    setOverallProgress(calculateOverall(currentPhase, phaseProgress))
  }, [currentPhase, phaseProgress, calculateOverall])

  const handleReset = () => {
    setIsPlaying(false)
    setCurrentPhase(0)
    setPhaseProgress(0)
    setOverallProgress(0)
  }

  const handlePhaseClick = (index: number) => {
    setCurrentPhase(index)
    setPhaseProgress(0)
  }

  const handlePrevPhase = () => {
    if (currentPhase > 0) {
      setCurrentPhase(prev => prev - 1)
      setPhaseProgress(0)
    }
  }

  const handleNextPhase = () => {
    if (currentPhase < customPhases.length - 1) {
      setCurrentPhase(prev => prev + 1)
      setPhaseProgress(0)
    }
  }

  return (
    <main className="min-h-screen bg-background transition-colors duration-300">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono bg-warning/20 text-warning px-2 py-0.5 rounded">
              DEV
            </span>
            <h1 className="text-sm font-medium text-foreground">Scanner Preview</h1>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Scanner Preview Area - positioned higher with bottom padding for controls */}
      <div
        className="flex flex-col items-center px-4 pt-12 pb-80"
        style={{ minHeight: "calc(100vh - 56px)" }}
      >
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-normal mb-2 text-foreground tracking-tight">
            Analyzing example-domain.com
          </h2>
          <p className="text-muted-foreground">
            {customPhases[currentPhase]?.description || "Starting..."}
          </p>
        </div>

        <MultiPhaseScanner
          currentPhase={currentPhase}
          phaseProgress={phaseProgress}
          overallProgress={overallProgress}
          phases={customPhases}
        />
      </div>

        {/* Control Panel */}
        <div
          className={`fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-2xl transition-all duration-300 ${
            isPanelMinimized ? "translate-y-[calc(100%-48px)]" : ""
          }`}
        >
          {/* Panel Header - Always visible */}
          <button
            onClick={() => setIsPanelMinimized(!isPanelMinimized)}
            className="w-full h-12 flex items-center justify-between px-4 hover:bg-muted/50 transition-colors border-b border-border"
          >
            <span className="text-sm font-medium text-foreground">Controls</span>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground font-mono">
                Phase {currentPhase + 1}/{customPhases.length} · {phaseProgress.toFixed(0)}% · Overall {overallProgress}%
              </span>
              {isPanelMinimized ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>

          {/* Panel Content */}
          <div className="p-4 space-y-4">
            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handleReset}
                className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
                title="Reset"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={handlePrevPhase}
                disabled={currentPhase === 0}
                className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30"
                title="Previous Phase"
              >
                <SkipBack className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-3 rounded-xl bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              <button
                onClick={handleNextPhase}
                disabled={currentPhase === customPhases.length - 1}
                className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30"
                title="Next Phase"
              >
                <SkipForward className="h-4 w-4" />
              </button>

              {/* Speed selector */}
              <div className="ml-4 flex items-center gap-1 bg-muted rounded-lg p-1">
                {[1, 2, 4].map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                      speed === s
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Phase Selector */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">Phases</label>
              <div className="flex gap-2">
                {customPhases.map((phase, i) => (
                  <button
                    key={phase.id}
                    onClick={() => handlePhaseClick(i)}
                    className={`flex-1 p-3 rounded-lg border transition-all text-left ${
                      i === currentPhase
                        ? "border-accent bg-accent/10"
                        : i < currentPhase
                          ? "border-accent/30 bg-accent/5"
                          : "border-border bg-muted/30 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`${i === currentPhase ? "text-accent" : "text-muted-foreground"}`}>
                        {phase.icon}
                      </span>
                      <span className={`text-xs font-medium ${i === currentPhase ? "text-foreground" : "text-muted-foreground"}`}>
                        {i + 1}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground truncate block">
                      {phase.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Progress Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground font-medium">Phase Progress</label>
                <span className="text-xs font-mono text-foreground">{phaseProgress.toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={phaseProgress}
                onChange={(e) => setPhaseProgress(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>

            {/* Accent Color Picker */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">Accent Color</label>
              <div className="flex gap-2">
                {accentPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setAccentColor(accentColor === preset.value ? null : preset.value)}
                    className={`group relative w-8 h-8 rounded-lg border-2 transition-all ${
                      accentColor === preset.value
                        ? "border-foreground scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: preset.hex }}
                    title={preset.name}
                  >
                    {accentColor === preset.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                ))}
                <button
                  onClick={() => setAccentColor(null)}
                  className={`px-3 h-8 rounded-lg border text-xs font-medium transition-all ${
                    accentColor === null
                      ? "border-foreground bg-muted text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Default
                </button>
              </div>
            </div>

            {/* Phase Editor Toggle */}
            <div className="border-t border-border pt-4">
              <button
                onClick={() => setIsEditorOpen(!isEditorOpen)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Settings2 className="h-4 w-4" />
                <span>Phase Editor</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isEditorOpen ? "rotate-180" : ""}`} />
              </button>

              {isEditorOpen && (
                <div className="mt-4 space-y-4">
                  {/* Editor header */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Customize items for each phase (comma-separated)
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleImportConfig}
                        className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                        title="Import from clipboard"
                      >
                        <ClipboardPaste className="h-3 w-3" />
                        Import
                      </button>
                      <button
                        onClick={handleExportConfig}
                        className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedExport ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedExport ? "Copied!" : "Export"}
                      </button>
                      <button
                        onClick={handleResetAll}
                        className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <RotateCw className="h-3 w-3" />
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Save to source button */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
                    <button
                      onClick={handleSaveToSource}
                      disabled={saveStatus === "saving"}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {saveStatus === "saving" ? (
                        <RotateCw className="h-4 w-4 animate-spin" />
                      ) : saveStatus === "saved" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved!" : "Save to Source"}
                    </button>
                    <div className="flex-1 text-xs text-muted-foreground">
                      {saveStatus === "saved" ? (
                        <span className="text-accent">
                          Saved to <code className="bg-muted px-1 rounded">src/config/scanner-phases.json</code> — commit to ship
                        </span>
                      ) : saveStatus === "error" ? (
                        <span className="text-destructive">Failed to save. Make sure you're in dev mode.</span>
                      ) : (
                        <span>Writes to <code className="bg-muted px-1 rounded">src/config/scanner-phases.json</code></span>
                      )}
                    </div>
                  </div>

                  {/* Phase editors */}
                  <div className="grid gap-3 max-h-48 overflow-y-auto pr-2">
                    {DEFAULT_PHASES.map((phase) => {
                      const isCustomized = !!customPhaseItems[phase.id]
                      const currentItems = customPhaseItems[phase.id] ?? phase.items.join(", ")

                      return (
                        <div key={phase.id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-xs font-medium text-foreground">
                              <span className="text-muted-foreground">{phase.icon}</span>
                              {phase.name}
                              {isCustomized && (
                                <span className="px-1 py-0.5 text-[9px] bg-accent/20 text-accent rounded">
                                  modified
                                </span>
                              )}
                            </label>
                            {isCustomized && (
                              <button
                                onClick={() => handleResetPhase(phase.id)}
                                className="text-[10px] text-muted-foreground hover:text-foreground"
                              >
                                reset
                              </button>
                            )}
                          </div>
                          <textarea
                            value={currentItems}
                            onChange={(e) => handlePhaseItemsChange(phase.id, e.target.value)}
                            placeholder={phase.items.join(", ")}
                            className="w-full h-16 px-2 py-1.5 text-xs font-mono bg-muted/50 border border-border rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-accent text-foreground placeholder:text-muted-foreground/50"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
  )
}
