"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  ChevronUp,
  ChevronDown,
  Play,
  SkipForward,
  RotateCcw,
  Settings2,
  Layers,
  BarChart3,
  LayoutGrid,
  Eye,
  EyeOff,
  Zap,
  Home,
  FileText,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export type ScoreStyle = "circle" | "bar" | "gauge" | "numeric" | "radial"
export type CategoryStyle = "cards" | "list" | "compact" | "pills"
export type IssueStyle = "expandable" | "inline" | "cards" | "table"
export type ScannerStyle = "v0" | "radar" | "pulse" | "grid" | "minimal"

interface DevPanelProps {
  // Widget style controls for report page
  scoreStyle?: ScoreStyle
  categoryStyle?: CategoryStyle
  issueStyle?: IssueStyle
  onScoreStyleChange?: (style: ScoreStyle) => void
  onCategoryStyleChange?: (style: CategoryStyle) => void
  onIssueStyleChange?: (style: IssueStyle) => void
  // Scanner style controls for loading page
  scannerStyle?: ScannerStyle
  onScannerStyleChange?: (style: ScannerStyle) => void
  // Animation controls
  onReplayAnimation?: () => void
}

export function DevPanel({
  scoreStyle = "circle",
  categoryStyle = "cards",
  issueStyle = "expandable",
  scannerStyle = "v0",
  onScoreStyleChange,
  onCategoryStyleChange,
  onIssueStyleChange,
  onScannerStyleChange,
  onReplayAnimation,
}: DevPanelProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [height, setHeight] = useState(180)
  const [activeTab, setActiveTab] = useState<"navigation" | "widgets" | "scanner">("navigation")
  const router = useRouter()
  const pathname = usePathname()

  // Mock domains for quick testing
  const testDomains = [
    "airbnb.com",
    "vrbo.com",
    "booking.com",
    "example-str.com",
  ]

  const handleSkipToResults = (domain: string) => {
    router.push(`/audit?domain=${domain}&skip=true`)
  }

  const handleGoHome = () => {
    router.push("/")
  }

  const isHomePage = pathname === "/"
  const isAuditPage = pathname === "/audit"

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-0 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-t-lg bg-card border border-b-0 border-border px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <Settings2 className="h-3.5 w-3.5" />
        Dev Panel
        <ChevronUp className="h-3.5 w-3.5" />
      </button>
    )
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card shadow-2xl"
      style={{ height }}
    >
      {/* Resize handle */}
      <div
        className="absolute -top-1 left-0 right-0 h-2 cursor-ns-resize hover:bg-accent/20"
        onMouseDown={(e) => {
          const startY = e.clientY
          const startHeight = height
          const onMouseMove = (e: MouseEvent) => {
            const newHeight = Math.max(120, Math.min(400, startHeight + (startY - e.clientY)))
            setHeight(newHeight)
          }
          const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove)
            document.removeEventListener("mouseup", onMouseUp)
          }
          document.addEventListener("mousemove", onMouseMove)
          document.addEventListener("mouseup", onMouseUp)
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
        <div className="flex items-center gap-1">
          {/* Tabs */}
          <TabButton
            active={activeTab === "navigation"}
            onClick={() => setActiveTab("navigation")}
            icon={<Zap className="h-3.5 w-3.5" />}
            label="Quick Nav"
          />
          <TabButton
            active={activeTab === "widgets"}
            onClick={() => setActiveTab("widgets")}
            icon={<LayoutGrid className="h-3.5 w-3.5" />}
            label="Widgets"
          />
          <TabButton
            active={activeTab === "scanner"}
            onClick={() => setActiveTab("scanner")}
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            label="Scanner"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isHomePage ? "Home" : isAuditPage ? "Audit Page" : pathname}
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded p-1 hover:bg-muted"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100%-41px)] overflow-auto p-4">
        {activeTab === "navigation" && (
          <div className="space-y-4">
            {/* Quick Navigation */}
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Navigation
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGoHome}
                  className="bg-transparent"
                >
                  <Home className="mr-2 h-3.5 w-3.5" />
                  Home
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/animations")}
                  className="bg-transparent"
                >
                  <Play className="mr-2 h-3.5 w-3.5" />
                  Animation Viewer
                </Button>
                {testDomains.map((domain) => (
                  <Button
                    key={domain}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSkipToResults(domain)}
                    className="bg-transparent"
                  >
                    <SkipForward className="mr-2 h-3.5 w-3.5" />
                    {domain}
                  </Button>
                ))}
              </div>
            </div>

            {/* Page Actions */}
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Page Actions
              </h3>
              <div className="flex flex-wrap gap-2">
                {onReplayAnimation && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onReplayAnimation}
                    className="bg-transparent"
                  >
                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                    Replay Animation
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="bg-transparent"
                >
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Refresh Page
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "widgets" && (
          <div className="grid grid-cols-3 gap-6">
            {/* Score Style */}
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Score Display
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {(["circle", "bar", "gauge", "numeric", "radial"] as ScoreStyle[]).map((style) => (
                  <StylePill
                    key={style}
                    label={style}
                    isActive={scoreStyle === style}
                    onClick={() => onScoreStyleChange?.(style)}
                  />
                ))}
              </div>
            </div>

            {/* Category Style */}
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Category Cards
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {(["cards", "list", "compact", "pills"] as CategoryStyle[]).map((style) => (
                  <StylePill
                    key={style}
                    label={style}
                    isActive={categoryStyle === style}
                    onClick={() => onCategoryStyleChange?.(style)}
                  />
                ))}
              </div>
            </div>

            {/* Issue Style */}
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Issue Display
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {(["expandable", "inline", "cards", "table"] as IssueStyle[]).map((style) => (
                  <StylePill
                    key={style}
                    label={style}
                    isActive={issueStyle === style}
                    onClick={() => onIssueStyleChange?.(style)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "scanner" && (
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Scanner Animation Style
              </h3>
              <div className="flex flex-wrap gap-2">
                {(["v0", "radar", "pulse", "grid", "minimal"] as ScannerStyle[]).map((style) => (
                  <Button
                    key={style}
                    variant={scannerStyle === style ? "default" : "outline"}
                    size="sm"
                    onClick={() => onScannerStyleChange?.(style)}
                    className={scannerStyle !== style ? "bg-transparent" : ""}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {onReplayAnimation && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Animation Controls
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReplayAnimation}
                  className="bg-transparent"
                >
                  <Play className="mr-2 h-3.5 w-3.5" />
                  Preview Scanner
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function StylePill({
  label,
  isActive,
  onClick,
}: {
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
        isActive
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      }`}
    >
      {label}
    </button>
  )
}
