"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { AuditResult, AuditRecommendation } from "@/types/audit"
import {
  Zap,
  Search,
  Shield,
  Smartphone,
  MousePointerClick,
  FileText,
  Lock,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
} from "lucide-react"

interface ReportVariantBProps {
  result: AuditResult
  className?: string
}

// Subtle color configurations for categories
const CATEGORY_COLORS: Record<string, { accent: string; bg: string; text: string }> = {
  Performance: { accent: "border-l-violet-300", bg: "bg-violet-50/60", text: "text-violet-600" },
  SEO: { accent: "border-l-blue-300", bg: "bg-blue-50/60", text: "text-blue-600" },
  Trust: { accent: "border-l-emerald-300", bg: "bg-emerald-50/60", text: "text-emerald-600" },
  Security: { accent: "border-l-slate-300", bg: "bg-slate-50/60", text: "text-slate-600" },
  "Trust & Security": { accent: "border-l-emerald-300", bg: "bg-emerald-50/60", text: "text-emerald-600" },
  Mobile: { accent: "border-l-orange-300", bg: "bg-orange-50/60", text: "text-orange-600" },
  "Mobile Experience": { accent: "border-l-orange-300", bg: "bg-orange-50/60", text: "text-orange-600" },
  Conversion: { accent: "border-l-rose-300", bg: "bg-rose-50/60", text: "text-rose-600" },
  Content: { accent: "border-l-indigo-300", bg: "bg-indigo-50/60", text: "text-indigo-600" },
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Performance: Zap,
  SEO: Search,
  Trust: Shield,
  Security: Lock,
  "Trust & Security": Shield,
  Mobile: Smartphone,
  "Mobile Experience": Smartphone,
  Conversion: MousePointerClick,
  Content: FileText,
}

// Clean score ring component
function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10b981"
    if (score >= 50) return "#f59e0b"
    return "#ef4444"
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f8fafc"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getScoreColor(score)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold text-gray-900">{score}</span>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Score</span>
      </div>
    </div>
  )
}

// Category card with subtle styling
function CategoryCard({
  name,
  score,
  weight,
  description,
  issueCount,
}: {
  name: string
  score: number
  weight: number
  description: string
  issueCount: number
}) {
  const config = CATEGORY_COLORS[name] || CATEGORY_COLORS.Content
  const Icon = CATEGORY_ICONS[name] || FileText

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600"
    if (score >= 50) return "text-amber-600"
    return "text-red-600"
  }

  return (
    <div className={cn(
      "bg-white/70 backdrop-blur-sm rounded-lg p-5 shadow-sm shadow-gray-100/80 hover:shadow-md hover:shadow-gray-200/50 transition-all border-l-[3px]",
      config.accent
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-9 h-9 rounded-md flex items-center justify-center", config.bg)}>
          <Icon className={cn("w-4 h-4", config.text)} strokeWidth={1.5} />
        </div>
        {issueCount > 0 && (
          <span className="text-xs font-medium text-gray-400 bg-gray-100/80 px-2 py-0.5 rounded-full">
            {issueCount} issue{issueCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between mb-2">
        <div>
          <h3 className="text-sm font-medium text-gray-900">{name}</h3>
          <p className="text-xs text-gray-400">{Math.round(weight * 100)}% weight</p>
        </div>
        <span className={cn("text-2xl font-semibold", getScoreColor(score))}>{score}</span>
      </div>

      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500",
            score >= 80 ? "bg-emerald-400" : score >= 50 ? "bg-amber-400" : "bg-red-400"
          )}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

// Recommendation row with subtle styling
function RecommendationRow({ recommendation }: { recommendation: AuditRecommendation }) {
  const statusConfig = {
    pass: {
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      bg: "bg-emerald-50/50",
      label: "Passing",
    },
    fail: {
      icon: XCircle,
      iconColor: "text-red-500",
      bg: "bg-red-50/50",
      label: "Issue",
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-amber-500",
      bg: "bg-amber-50/50",
      label: "Warning",
    },
  }

  const config = statusConfig[recommendation.status]
  const StatusIcon = config.icon

  return (
    <div className="flex items-start gap-3 py-3 px-4 hover:bg-gray-50/50 transition-colors">
      <div className={cn("p-1.5 rounded-md mt-0.5", config.bg)}>
        <StatusIcon className={cn("w-3.5 h-3.5", config.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-gray-900">{recommendation.title}</span>
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded-md font-medium",
            recommendation.impact === "High" ? "bg-red-50/80 text-red-600" :
            recommendation.impact === "Medium" ? "bg-amber-50/80 text-amber-600" :
            "bg-gray-50/80 text-gray-500"
          )}>
            {recommendation.impact}
          </span>
        </div>
        <p className="text-xs text-gray-500 line-clamp-1">{recommendation.description}</p>
      </div>
      <span className="text-xs text-gray-400 shrink-0">{recommendation.category}</span>
    </div>
  )
}

export function ReportVariantB({ result, className }: ReportVariantBProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "issues">("overview")

  const criticalIssues = result.recommendations.filter((r) => r.status === "fail")
  const warningIssues = result.recommendations.filter((r) => r.status === "warning")
  const passingIssues = result.recommendations.filter((r) => r.status === "pass")

  const categoryIssueCounts = result.categories.reduce((acc, cat) => {
    acc[cat.name] = result.recommendations.filter(
      (r) => r.category === cat.name && r.status !== "pass"
    ).length
    return acc
  }, {} as Record<string, number>)

  const formattedDate = new Date(result.timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className={cn("min-h-screen bg-gradient-to-b from-gray-50 to-gray-100/30", className)}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-medium text-gray-900">Website Audit</h1>
              <p className="text-sm text-gray-500">{result.domain}</p>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              {formattedDate}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <section className="mb-10">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-8 shadow-sm shadow-gray-100/80">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Score */}
              <div className="flex flex-col items-center md:items-start">
                <ScoreRing score={result.overallScore} />

                <div className="flex gap-3 mt-6 flex-wrap justify-center md:justify-start">
                  <div className="flex items-center gap-1.5 text-sm">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-gray-600">{criticalIssues.length} critical</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-gray-600">{warningIssues.length} warnings</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-gray-600">{passingIssues.length} passing</span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="text-center md:text-left">
                <p className="text-gray-600 leading-relaxed mb-4">{result.summary}</p>

                {result.projectedScore > result.overallScore && (
                  <div className="inline-flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50/60 px-3 py-1.5 rounded-md">
                    <TrendingUp className="w-4 h-4" />
                    <span>+{result.projectedScore - result.overallScore} points possible with fixes</span>
                  </div>
                )}

                {result.monthlyRevenueLoss > 0 && (
                  <p className="mt-3 text-sm text-gray-500">
                    Estimated monthly impact: <span className="font-medium text-gray-900">${result.monthlyRevenueLoss.toLocaleString()}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-gray-100/60 backdrop-blur-sm rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              activeTab === "overview"
                ? "bg-white/90 text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("issues")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
              activeTab === "issues"
                ? "bg-white/90 text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            All Issues
            <span className="text-xs bg-gray-200/80 px-1.5 py-0.5 rounded">
              {criticalIssues.length + warningIssues.length}
            </span>
          </button>
        </div>

        {activeTab === "overview" ? (
          <>
            {/* Categories Grid */}
            <section className="mb-10">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                Category Breakdown
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.categories.map((category) => (
                  <CategoryCard
                    key={category.name}
                    name={category.name}
                    score={category.score}
                    weight={category.weight}
                    description={category.description}
                    issueCount={categoryIssueCounts[category.name] || 0}
                  />
                ))}
              </div>
            </section>

            {/* Top Issues */}
            {criticalIssues.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Priority Issues
                  </h3>
                  <span className="text-xs text-gray-400">{criticalIssues.length} found</span>
                </div>

                <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm shadow-gray-100/80 overflow-hidden">
                  {criticalIssues.slice(0, 5).map((issue, idx) => (
                    <RecommendationRow key={idx} recommendation={issue} />
                  ))}
                </div>

                {criticalIssues.length > 5 && (
                  <button
                    onClick={() => setActiveTab("issues")}
                    className="mt-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    View all issues
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </section>
            )}
          </>
        ) : (
          /* All Issues Tab */
          <section className="space-y-6">
            {criticalIssues.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Critical Issues ({criticalIssues.length})
                </h3>
                <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm shadow-gray-100/80 overflow-hidden">
                  {criticalIssues.map((issue, idx) => (
                    <RecommendationRow key={idx} recommendation={issue} />
                  ))}
                </div>
              </div>
            )}

            {warningIssues.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Warnings ({warningIssues.length})
                </h3>
                <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm shadow-gray-100/80 overflow-hidden">
                  {warningIssues.map((issue, idx) => (
                    <RecommendationRow key={idx} recommendation={issue} />
                  ))}
                </div>
              </div>
            )}

            {passingIssues.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Passing ({passingIssues.length})
                </h3>
                <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm shadow-gray-100/80 overflow-hidden">
                  {passingIssues.map((issue, idx) => (
                    <RecommendationRow key={idx} recommendation={issue} />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* CTA Section */}
        <section className="mt-12">
          <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl p-8 text-center shadow-lg shadow-gray-900/10">
            <h3 className="text-xl font-medium text-white mb-2">
              Ready to fix these issues?
            </h3>
            <p className="text-gray-400 text-sm mb-6 max-w-lg mx-auto">
              HostAI can help optimize your website and improve your booking flow.
            </p>
            <a
              href="https://hostai.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-gray-900 font-medium px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Get Started
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}
