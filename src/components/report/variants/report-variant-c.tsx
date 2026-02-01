"use client"

import { useState, useEffect, useId } from "react"
import { cn } from "@/lib/utils"
import type { AuditResult, AuditRecommendation } from "@/types/audit"
import {
  Zap,
  Search,
  Shield,
  Lock,
  Smartphone,
  MousePointerClick,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  BarChart3,
  Clock,
  DollarSign,
  ChevronRight,
  Layers,
  ArrowUpRight,
} from "lucide-react"

interface ReportVariantCProps {
  result: AuditResult
  className?: string
}

// Light mode color palette (adapted from terminal style)
const TERMINAL_COLORS = {
  green: { text: "text-emerald-600", bg: "bg-emerald-500", bgDim: "bg-emerald-50/70" },
  yellow: { text: "text-amber-600", bg: "bg-amber-500", bgDim: "bg-amber-50/70" },
  red: { text: "text-rose-600", bg: "bg-rose-500", bgDim: "bg-rose-50/70" },
  blue: { text: "text-cyan-600", bg: "bg-cyan-500", bgDim: "bg-cyan-50/70" },
  purple: { text: "text-violet-600", bg: "bg-violet-500", bgDim: "bg-violet-50/70" },
  gray: { text: "text-slate-500", bg: "bg-slate-400", bgDim: "bg-slate-100/70" },
}

function getScoreTheme(score: number) {
  if (score >= 80) return TERMINAL_COLORS.green
  if (score >= 50) return TERMINAL_COLORS.yellow
  return TERMINAL_COLORS.red
}

function getStatusTheme(status: "pass" | "fail" | "warning") {
  if (status === "pass") return TERMINAL_COLORS.green
  if (status === "warning") return TERMINAL_COLORS.yellow
  return TERMINAL_COLORS.red
}

// Category icon and color mapping
const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: typeof TERMINAL_COLORS.blue }> = {
  Performance: { icon: Zap, color: TERMINAL_COLORS.yellow },
  SEO: { icon: Search, color: TERMINAL_COLORS.blue },
  Trust: { icon: Shield, color: TERMINAL_COLORS.purple },
  Security: { icon: Lock, color: TERMINAL_COLORS.green },
  "Trust & Security": { icon: Shield, color: TERMINAL_COLORS.purple },
  Mobile: { icon: Smartphone, color: TERMINAL_COLORS.blue },
  "Mobile Experience": { icon: Smartphone, color: TERMINAL_COLORS.blue },
  Conversion: { icon: MousePointerClick, color: TERMINAL_COLORS.green },
  Content: { icon: FileText, color: TERMINAL_COLORS.gray },
}

// Animated score counter
function AnimatedScore({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const duration = 1200
    const start = Date.now()
    const animate = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value])

  return <span className={className}>{display}</span>
}

// Progress ring component
function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 4,
  color,
  className,
}: {
  progress: number
  size?: number
  strokeWidth?: number
  color: string
  className?: string
}) {
  const instanceId = useId()
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress / 100)

  return (
    <svg width={size} height={size} className={cn("transform -rotate-90", className)}>
      <defs>
        <linearGradient id={`ring-gradient-${instanceId}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#f1f5f9"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={`url(#ring-gradient-${instanceId})`}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={cn("transition-all duration-1000 ease-out", color)}
      />
    </svg>
  )
}

// Horizontal bar chart
function MiniBar({ value, maxValue = 100, color }: { value: number; maxValue?: number; color: string }) {
  const percentage = Math.min((value / maxValue) * 100, 100)
  return (
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden w-full">
      <div
        className={cn("h-full rounded-full transition-all duration-700", color)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

// Status indicator dot with pulse
function StatusDot({ status }: { status: "pass" | "fail" | "warning" }) {
  const theme = getStatusTheme(status)
  return (
    <span className="relative flex h-2.5 w-2.5">
      {status === "fail" && (
        <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", theme.bg)} />
      )}
      <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", theme.bg)} />
    </span>
  )
}

// Panel header component
function PanelHeader({ title, icon: Icon, action }: { title: string; icon?: React.ElementType; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50/40">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{title}</span>
      </div>
      {action}
    </div>
  )
}

// Metric card
function MetricCard({
  label,
  value,
  unit,
  trend,
  color,
}: {
  label: string
  value: string | number
  unit?: string
  trend?: "up" | "down"
  color: typeof TERMINAL_COLORS.blue
}) {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm shadow-slate-100/80 p-3">
      <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={cn("text-xl font-mono font-bold", color.text)}>{value}</span>
        {unit && <span className="text-xs text-slate-400">{unit}</span>}
        {trend && (
          <span className={cn("ml-auto", trend === "up" ? "text-emerald-500" : "text-rose-500")}>
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          </span>
        )}
      </div>
    </div>
  )
}

// Category row in the breakdown panel
function CategoryRow({ name, score, weight }: { name: string; score: number; weight: number }) {
  const config = CATEGORY_CONFIG[name] || { icon: FileText, color: TERMINAL_COLORS.gray }
  const Icon = config.icon
  const theme = getScoreTheme(score)

  return (
    <div className="flex items-center gap-3 py-2 px-3 hover:bg-slate-50/50 transition-colors group">
      <div className={cn("p-1.5 rounded-md", config.color.bgDim)}>
        <Icon className={cn("w-3 h-3", config.color.text)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-700 truncate">{name}</span>
          <span className={cn("text-xs font-mono font-medium", theme.text)}>{score}</span>
        </div>
        <MiniBar value={score} color={theme.bg} />
      </div>
      <span className="text-[10px] text-slate-400 font-mono">{weight}%</span>
    </div>
  )
}

// Recommendation row
function RecommendationRow({ rec, index }: { rec: AuditRecommendation; index: number }) {
  const theme = getStatusTheme(rec.status)
  const impactColors = {
    High: TERMINAL_COLORS.red,
    Medium: TERMINAL_COLORS.yellow,
    Low: TERMINAL_COLORS.gray,
  }
  const impactTheme = impactColors[rec.impact] || TERMINAL_COLORS.gray

  return (
    <div className="flex items-start gap-3 py-2.5 px-3 hover:bg-slate-50/50 transition-colors group">
      <span className="text-[10px] text-slate-400 font-mono pt-0.5">{String(index + 1).padStart(2, "0")}</span>
      <StatusDot status={rec.status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs text-slate-800 font-medium truncate">{rec.title}</span>
          <span className={cn("text-[9px] px-1.5 py-0.5 rounded-md font-medium uppercase tracking-wide", impactTheme.bgDim, impactTheme.text)}>
            {rec.impact}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 line-clamp-1 group-hover:line-clamp-none transition-all">
          {rec.description}
        </p>
      </div>
      <span className="text-[10px] text-slate-400 uppercase tracking-wide shrink-0">{rec.category}</span>
    </div>
  )
}

// Main score gauge panel
function ScoreGaugePanel({ score, projected }: { score: number; projected: number }) {
  const theme = getScoreTheme(score)
  const delta = projected - score

  return (
    <div className="relative">
      <div className="flex items-center justify-center gap-8">
        {/* Current score */}
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center">
            <ProgressRing progress={score} size={120} strokeWidth={6} color={theme.text} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <AnimatedScore value={score} className={cn("text-3xl font-mono font-bold", theme.text)} />
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">Score</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 uppercase tracking-wider">Current</div>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center gap-1">
          <ChevronRight className="w-5 h-5 text-slate-300" />
          <span className={cn("text-xs font-mono font-medium", delta > 0 ? "text-emerald-500" : "text-slate-400")}>
            {delta > 0 ? `+${delta}` : delta}
          </span>
        </div>

        {/* Projected score */}
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center">
            <ProgressRing progress={projected} size={120} strokeWidth={6} color="text-emerald-500" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <AnimatedScore value={projected} className="text-3xl font-mono font-bold text-emerald-500" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">Score</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 uppercase tracking-wider">Projected</div>
        </div>
      </div>
    </div>
  )
}

// Stats ticker bar
function StatsTicker({ result }: { result: AuditResult }) {
  const criticalCount = result.recommendations.filter(r => r.status === "fail").length
  const warningCount = result.recommendations.filter(r => r.status === "warning").length
  const passCount = result.recommendations.filter(r => r.status === "pass").length

  return (
    <div className="flex items-center gap-6 px-4 py-2 bg-slate-50/30 text-[11px] font-mono overflow-x-auto max-w-[1600px] mx-auto">
      <div className="flex items-center gap-2">
        <Activity className="w-3 h-3 text-slate-400" />
        <span className="text-slate-400">STATUS</span>
        <span className={cn("font-medium", getScoreTheme(result.overallScore).text)}>
          {result.overallScore >= 80 ? "HEALTHY" : result.overallScore >= 50 ? "DEGRADED" : "CRITICAL"}
        </span>
      </div>
      <div className="h-3 w-px bg-slate-200/50" />
      <div className="flex items-center gap-2">
        <XCircle className="w-3 h-3 text-rose-500" />
        <span className="text-rose-600">{criticalCount} CRITICAL</span>
      </div>
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-3 h-3 text-amber-500" />
        <span className="text-amber-600">{warningCount} WARNING</span>
      </div>
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
        <span className="text-emerald-600">{passCount} PASS</span>
      </div>
      <div className="h-3 w-px bg-slate-200/50" />
      <div className="flex items-center gap-2 text-slate-400">
        <Clock className="w-3 h-3" />
        {new Date(result.timestamp).toLocaleString()}
      </div>
    </div>
  )
}

export function ReportVariantC({ result, className }: ReportVariantCProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Filter recommendations by category
  const filteredRecs = selectedCategory
    ? result.recommendations.filter(r => r.category === selectedCategory)
    : result.recommendations

  // Sort: fails first, then warnings, then passes
  const sortedRecs = [...filteredRecs].sort((a, b) => {
    const order = { fail: 0, warning: 1, pass: 2 }
    return order[a.status] - order[b.status]
  })

  return (
    <div className={cn("min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 text-slate-800", className)}>
      {/* Top bar */}
      <header className="bg-white/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-cyan-600 rounded-md flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-mono font-bold text-slate-800">GETHOST</span>
              <span className="text-sm font-mono text-cyan-600">.AI</span>
            </div>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-mono text-slate-500">{result.domain}</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={`https://${result.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-600 transition-colors"
            >
              Visit site <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>
        <StatsTicker result={result} />
      </header>

      {/* Main grid layout */}
      <main className="p-4 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-12 gap-4">
          {/* Left column: Score + Categories */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            {/* Score panel */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm shadow-slate-100/80 overflow-hidden">
              <PanelHeader title="Health Score" icon={Activity} />
              <div className="p-4">
                <ScoreGaugePanel score={result.overallScore} projected={result.projectedScore} />
              </div>
            </div>

            {/* Category breakdown */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm shadow-slate-100/80 overflow-hidden">
              <PanelHeader
                title="Category Breakdown"
                icon={Layers}
                action={
                  selectedCategory && (
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="text-[10px] text-cyan-600 hover:text-cyan-700"
                    >
                      Clear filter
                    </button>
                  )
                }
              />
              <div>
                {result.categories.map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name === selectedCategory ? null : cat.name)}
                    className={cn(
                      "w-full text-left transition-colors",
                      selectedCategory === cat.name && "bg-slate-50/50"
                    )}
                  >
                    <CategoryRow name={cat.name} score={cat.score} weight={cat.weight} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center column: Metrics + Recommendations */}
          <div className="col-span-12 lg:col-span-6 space-y-4">
            {/* Key metrics row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard
                label="Revenue Loss"
                value={`$${(result.monthlyRevenueLoss / 1000).toFixed(1)}k`}
                unit="/mo"
                trend="down"
                color={TERMINAL_COLORS.red}
              />
              <MetricCard
                label="Issues Found"
                value={result.recommendations.filter(r => r.status !== "pass").length}
                color={TERMINAL_COLORS.yellow}
              />
              <MetricCard
                label="Score Gain"
                value={`+${result.projectedScore - result.overallScore}`}
                unit="pts"
                trend="up"
                color={TERMINAL_COLORS.green}
              />
              <MetricCard
                label="Categories"
                value={result.categories.length}
                color={TERMINAL_COLORS.blue}
              />
            </div>

            {/* Recommendations list */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm shadow-slate-100/80 overflow-hidden">
              <PanelHeader
                title={selectedCategory ? `${selectedCategory} Issues` : "All Recommendations"}
                icon={BarChart3}
                action={
                  <span className="text-[10px] text-slate-400 font-mono">
                    {sortedRecs.length} items
                  </span>
                }
              />
              <div className="max-h-[480px] overflow-y-auto">
                {sortedRecs.map((rec, idx) => (
                  <RecommendationRow key={idx} rec={rec} index={idx} />
                ))}
              </div>
            </div>
          </div>

          {/* Right column: Summary + Stats */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            {/* Summary panel */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm shadow-slate-100/80 overflow-hidden">
              <PanelHeader title="Analysis Summary" icon={FileText} />
              <div className="p-4">
                <p className="text-xs text-slate-600 leading-relaxed">{result.summary}</p>
              </div>
            </div>

            {/* Impact breakdown */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm shadow-slate-100/80 overflow-hidden">
              <PanelHeader title="Impact Distribution" icon={BarChart3} />
              <div className="p-4 space-y-3">
                {["High", "Medium", "Low"].map(impact => {
                  const count = result.recommendations.filter(r => r.impact === impact && r.status !== "pass").length
                  const total = result.recommendations.filter(r => r.status !== "pass").length
                  const percentage = total > 0 ? (count / total) * 100 : 0
                  const impactColors = {
                    High: TERMINAL_COLORS.red,
                    Medium: TERMINAL_COLORS.yellow,
                    Low: TERMINAL_COLORS.gray,
                  }
                  const theme = impactColors[impact as keyof typeof impactColors]

                  return (
                    <div key={impact}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-400 uppercase">{impact}</span>
                        <span className={cn("text-xs font-mono", theme.text)}>{count}</span>
                      </div>
                      <MiniBar value={percentage} color={theme.bg} />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Quick stats */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm shadow-slate-100/80 overflow-hidden">
              <PanelHeader title="Quick Stats" icon={DollarSign} />
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Pass Rate</span>
                  <span className="text-xs font-mono text-emerald-500">
                    {Math.round((result.recommendations.filter(r => r.status === "pass").length / result.recommendations.length) * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Avg Category Score</span>
                  <span className="text-xs font-mono text-cyan-500">
                    {Math.round(result.categories.reduce((sum, c) => sum + c.score, 0) / result.categories.length)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">High Impact Issues</span>
                  <span className="text-xs font-mono text-rose-500">
                    {result.recommendations.filter(r => r.impact === "High" && r.status === "fail").length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer CTA - Full width at bottom */}
      <footer className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-200/50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-50/70 rounded-md">
                <TrendingUp className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Ready to improve your score?</p>
                <p className="text-xs text-slate-500">HostAI can automate these fixes and boost conversions.</p>
              </div>
            </div>
            <a
              href="https://hostai.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
            >
              Get Started
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
