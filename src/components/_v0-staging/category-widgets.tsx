"use client"

import { Gauge, Search, Shield, Smartphone, Star } from "lucide-react"
import type { AuditCategory } from "@/lib/audit-types"
import type { CategoryStyle } from "@/components/_v0-staging/admin-toolbar"

interface CategoryWidgetsProps {
  categories: AuditCategory[]
  style: CategoryStyle
  activeCategory: string | null
  onCategoryClick: (id: string | null) => void
}

const categoryIcons: Record<string, typeof Gauge> = {
  performance: Gauge,
  seo: Search,
  trust: Shield,
  mobile: Smartphone,
  conversion: Star,
}

const statusColorMap = {
  good: { border: "border-accent", bg: "bg-accent/10", text: "text-accent" },
  warning: { border: "border-warning", bg: "bg-warning/10", text: "text-warning" },
  critical: { border: "border-destructive", bg: "bg-destructive/10", text: "text-destructive" },
}

const getStatusColors = (status: "good" | "warning" | "critical" | undefined) => {
  if (!status || !(status in statusColorMap)) {
    return statusColorMap.warning // fallback to warning
  }
  return statusColorMap[status]
}

export function CategoryWidgets({
  categories,
  style,
  activeCategory,
  onCategoryClick,
}: CategoryWidgetsProps) {
  switch (style) {
    case "cards":
      return <CardsStyle categories={categories} activeCategory={activeCategory} onCategoryClick={onCategoryClick} />
    case "list":
      return <ListStyle categories={categories} activeCategory={activeCategory} onCategoryClick={onCategoryClick} />
    case "compact":
      return <CompactStyle categories={categories} activeCategory={activeCategory} onCategoryClick={onCategoryClick} />
    case "pills":
      return <PillsStyle categories={categories} activeCategory={activeCategory} onCategoryClick={onCategoryClick} />
    default:
      return <CardsStyle categories={categories} activeCategory={activeCategory} onCategoryClick={onCategoryClick} />
  }
}

// Style 1: Grid Cards
function CardsStyle({ categories, activeCategory, onCategoryClick }: Omit<CategoryWidgetsProps, "style">) {
  return (
    <div className="grid gap-4 md:grid-cols-5">
      {categories.map((category) => {
        const Icon = categoryIcons[category.id] || Gauge
        const colors = getStatusColors(category.status)
        const isActive = activeCategory === category.id

        return (
          <button
            key={category.id}
            onClick={() => onCategoryClick(isActive ? null : category.id)}
            className={`rounded-xl border p-4 text-left transition-all hover:shadow-md ${
              isActive ? `${colors.border} ${colors.bg}` : "border-border bg-card"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-lg bg-primary/10 p-2">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              {category.issueCount > 0 && (
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                  {category.issueCount}
                </span>
              )}
            </div>
            <div className="mb-1 text-sm font-medium">{category.name}</div>
            <div className={`text-2xl font-bold ${colors.text}`}>
              {category.score}
              <span className="text-sm font-normal text-muted-foreground">/100</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// Style 2: Horizontal List
function ListStyle({ categories, activeCategory, onCategoryClick }: Omit<CategoryWidgetsProps, "style">) {
  return (
    <div className="space-y-2">
      {categories.map((category) => {
        const Icon = categoryIcons[category.id] || Gauge
        const colors = getStatusColors(category.status)
        const isActive = activeCategory === category.id

        return (
          <button
            key={category.id}
            onClick={() => onCategoryClick(isActive ? null : category.id)}
            className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all hover:shadow-sm ${
              isActive ? `${colors.border} ${colors.bg}` : "border-border bg-card"
            }`}
          >
            <div className="rounded-lg bg-primary/10 p-2">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-medium">{category.name}</div>
              <div className="text-sm text-muted-foreground">{category.description}</div>
            </div>
            <div className="flex items-center gap-4">
              {category.issueCount > 0 && (
                <span className="rounded-full bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive">
                  {category.issueCount} issues
                </span>
              )}
              <div className="text-right">
                <div className={`text-2xl font-bold ${colors.text}`}>{category.score}</div>
                <div className="text-xs text-muted-foreground">/ 100</div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// Style 3: Compact Bars
function CompactStyle({ categories, activeCategory, onCategoryClick }: Omit<CategoryWidgetsProps, "style">) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="space-y-4">
        {categories.map((category) => {
          const Icon = categoryIcons[category.id] || Gauge
          const colors = getStatusColors(category.status)
          const isActive = activeCategory === category.id

          return (
            <button
              key={category.id}
              onClick={() => onCategoryClick(isActive ? null : category.id)}
              className={`block w-full text-left transition-opacity ${isActive ? "" : "hover:opacity-80"}`}
            >
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {category.issueCount > 0 && (
                    <span className="text-xs text-destructive">{category.issueCount} issues</span>
                  )}
                  <span className={`text-sm font-bold ${colors.text}`}>{category.score}</span>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    category.status === "good" ? "bg-accent" : 
                    category.status === "warning" ? "bg-warning" : "bg-destructive"
                  }`}
                  style={{ width: `${category.score}%` }}
                />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Style 4: Pills / Tags
function PillsStyle({ categories, activeCategory, onCategoryClick }: Omit<CategoryWidgetsProps, "style">) {
  return (
    <div className="flex flex-wrap gap-3">
      {categories.map((category) => {
        const Icon = categoryIcons[category.id] || Gauge
        const colors = getStatusColors(category.status)
        const isActive = activeCategory === category.id

        return (
          <button
            key={category.id}
            onClick={() => onCategoryClick(isActive ? null : category.id)}
            className={`flex items-center gap-3 rounded-full border px-4 py-2 transition-all hover:shadow-sm ${
              isActive ? `${colors.border} ${colors.bg}` : "border-border bg-card"
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{category.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-lg font-bold ${colors.text}`}>{category.score}</span>
              {category.issueCount > 0 && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground">
                  {category.issueCount}
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
