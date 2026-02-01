import React from "react"

import { useState } from "react"
import { 
  Settings2, 
  Layers, 
  LayoutGrid, 
  BarChart3,
  X,
  ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"

export type WidgetStyle = "default" | "minimal" | "detailed" | "cards" | "dashboard"
export type ScoreStyle = "circle" | "bar" | "gauge" | "numeric" | "radial"
export type CategoryStyle = "cards" | "list" | "compact" | "pills"
export type IssueStyle = "expandable" | "inline" | "cards" | "table"

interface AdminToolbarProps {
  widgetStyle: WidgetStyle
  scoreStyle: ScoreStyle
  categoryStyle: CategoryStyle
  issueStyle: IssueStyle
  onWidgetStyleChange: (style: WidgetStyle) => void
  onScoreStyleChange: (style: ScoreStyle) => void
  onCategoryStyleChange: (style: CategoryStyle) => void
  onIssueStyleChange: (style: IssueStyle) => void
}

export function AdminToolbar({
  widgetStyle,
  scoreStyle,
  categoryStyle,
  issueStyle,
  onWidgetStyleChange,
  onScoreStyleChange,
  onCategoryStyleChange,
  onIssueStyleChange,
}: AdminToolbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        <Settings2 className="h-5 w-5" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-xl border border-border bg-card shadow-2xl">
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Admin: Widget Styles</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="rounded-lg p-1 hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto p-3">
        {/* Overall Layout */}
        <ToolbarSection
          title="Overall Layout"
          icon={<Layers className="h-4 w-4" />}
          isOpen={activeSection === "layout"}
          onToggle={() => setActiveSection(activeSection === "layout" ? null : "layout")}
        >
          <div className="grid grid-cols-2 gap-2">
            {(["default", "minimal", "detailed", "cards", "dashboard"] as WidgetStyle[]).map((style) => (
              <StyleButton
                key={style}
                label={style}
                isActive={widgetStyle === style}
                onClick={() => onWidgetStyleChange(style)}
              />
            ))}
          </div>
        </ToolbarSection>

        {/* Score Display */}
        <ToolbarSection
          title="Score Display"
          icon={<BarChart3 className="h-4 w-4" />}
          isOpen={activeSection === "score"}
          onToggle={() => setActiveSection(activeSection === "score" ? null : "score")}
        >
          <div className="grid grid-cols-2 gap-2">
            {(["circle", "bar", "gauge", "numeric", "radial"] as ScoreStyle[]).map((style) => (
              <StyleButton
                key={style}
                label={style}
                isActive={scoreStyle === style}
                onClick={() => onScoreStyleChange(style)}
              />
            ))}
          </div>
        </ToolbarSection>

        {/* Category Cards */}
        <ToolbarSection
          title="Category Cards"
          icon={<LayoutGrid className="h-4 w-4" />}
          isOpen={activeSection === "category"}
          onToggle={() => setActiveSection(activeSection === "category" ? null : "category")}
        >
          <div className="grid grid-cols-2 gap-2">
            {(["cards", "list", "compact", "pills"] as CategoryStyle[]).map((style) => (
              <StyleButton
                key={style}
                label={style}
                isActive={categoryStyle === style}
                onClick={() => onCategoryStyleChange(style)}
              />
            ))}
          </div>
        </ToolbarSection>

        {/* Issue Display */}
        <ToolbarSection
          title="Issue Display"
          icon={<Layers className="h-4 w-4" />}
          isOpen={activeSection === "issue"}
          onToggle={() => setActiveSection(activeSection === "issue" ? null : "issue")}
        >
          <div className="grid grid-cols-2 gap-2">
            {(["expandable", "inline", "cards", "table"] as IssueStyle[]).map((style) => (
              <StyleButton
                key={style}
                label={style}
                isActive={issueStyle === style}
                onClick={() => onIssueStyleChange(style)}
              />
            ))}
          </div>
        </ToolbarSection>
      </div>

      <div className="border-t border-border p-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs bg-transparent"
          onClick={() => {
            onWidgetStyleChange("default")
            onScoreStyleChange("circle")
            onCategoryStyleChange("cards")
            onIssueStyleChange("expandable")
          }}
        >
          Reset to Defaults
        </Button>
      </div>
    </div>
  )
}

function ToolbarSection({
  title,
  icon,
  isOpen,
  onToggle,
  children,
}: {
  title: string
  icon: React.ReactNode
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="mb-2">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-lg p-2 hover:bg-muted"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && <div className="mt-2 px-2">{children}</div>}
    </div>
  )
}

function StyleButton({
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
      className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors ${
        isActive
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      }`}
    >
      {label}
    </button>
  )
}
