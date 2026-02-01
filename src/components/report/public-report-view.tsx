"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { HostAILogo } from "@/components/icons/hostai-logo"
import type { AuditResult, AuditRecommendation } from "@/types/audit"
import {
  Zap,
  Search,
  Shield,
  Smartphone,
  MousePointerClick,
  FileText,
  Lock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react"

interface PublicReportViewProps {
  result: AuditResult
  onReset?: () => void
  className?: string
}

// Score color utilities matching the elitegen palette
function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-600"
  if (score >= 50) return "text-amber-500"
  return "text-rose-500"
}

function getScoreLabel(score: number) {
  if (score >= 80) return { label: "Excellent", color: "text-emerald-600", dot: "bg-emerald-500" }
  if (score >= 50) return { label: "Needs Work", color: "text-amber-600", dot: "bg-amber-500" }
  return { label: "Needs Urgent Attention", color: "text-rose-600", dot: "bg-rose-500" }
}

// Category icon mapping - more specific icons
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

// Category Card Component
function CategoryCard({
  name,
  score,
  issueCount,
}: {
  name: string
  score: number
  issueCount: number
}) {
  const Icon = CATEGORY_ICONS[name] || FileText
  const colorClass = getScoreColor(score)

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm shadow-gray-200/50 hover:shadow-md hover:shadow-gray-200/60 transition-all">
      <div className="flex justify-between items-start mb-3">
        <div className="p-2 bg-gray-50/80 rounded-md text-gray-500">
          <Icon size={18} strokeWidth={1.5} />
        </div>
        {issueCount > 0 && (
          <span className="bg-red-50 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">
            {issueCount}
          </span>
        )}
      </div>

      <div>
        <h4 className="font-medium text-gray-600 text-sm mb-1">{name}</h4>
        <div className="flex items-baseline gap-1">
          <span className={cn("text-2xl font-bold", colorClass)}>{score}</span>
          <span className="text-gray-300 text-sm">/100</span>
        </div>
      </div>
    </div>
  )
}

// Impact/Effort badges
function ImpactBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    High: "bg-green-50/80 text-green-700",
    Medium: "bg-yellow-50/80 text-yellow-700",
    Low: "bg-gray-50/80 text-gray-600",
  }
  return (
    <span className={cn("text-[10px] uppercase tracking-wide font-semibold px-2 py-1 rounded-md", colors[level] || colors.Low)}>
      {level} impact
    </span>
  )
}

function EffortBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    Low: "bg-green-50/80 text-green-600",
    Medium: "bg-yellow-50/80 text-yellow-600",
    High: "bg-red-50/80 text-red-600",
  }
  return (
    <span className={cn("text-[10px] uppercase tracking-wide font-semibold px-2 py-1 rounded-md", colors[level] || colors.Medium)}>
      {level} effort
    </span>
  )
}

// Quick Win Card
function QuickWinCard({ issue }: { issue: AuditRecommendation }) {
  const effort = issue.impact === "High" ? "Low" : issue.impact === "Medium" ? "Medium" : "High"

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-5 shadow-sm shadow-gray-200/50 hover:shadow-md hover:shadow-gray-200/60 transition-all">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-900 leading-snug">
          {issue.title}
        </h4>
        <Sparkles className="text-yellow-400 w-4 h-4 shrink-0 ml-2" />
      </div>
      <p className="text-gray-500 text-sm mb-4 leading-relaxed">
        {issue.description}
      </p>
      <div className="flex gap-2 flex-wrap">
        <ImpactBadge level={issue.impact} />
        <EffortBadge level={effort} />
      </div>
    </div>
  )
}

// Detailed Issue Row
function IssueRow({ issue }: { issue: AuditRecommendation }) {
  const severityConfig = {
    fail: {
      bg: "bg-red-50/60",
      icon: <XCircle className="w-5 h-5 text-red-400" />,
      badge: "text-red-600",
      label: "Critical"
    },
    warning: {
      bg: "bg-yellow-50/60",
      icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
      badge: "text-yellow-600",
      label: "Warning"
    },
    pass: {
      bg: "bg-green-50/60",
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      badge: "text-green-600",
      label: "Passed"
    },
  }
  const config = severityConfig[issue.status] || severityConfig.warning

  return (
    <div className={cn("p-4 rounded-lg flex gap-3", config.bg)}>
      <div className="shrink-0 mt-0.5">{config.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-medium text-gray-900">{issue.title}</span>
          <span className={cn("text-xs font-medium", config.badge)}>
            {config.label}
          </span>
        </div>
        <p className="text-sm text-gray-500">{issue.description}</p>
      </div>
      <span className="text-xs font-medium text-gray-400 uppercase shrink-0 hidden sm:block">
        {issue.category}
      </span>
    </div>
  )
}

export function PublicReportView({ result, onReset, className }: PublicReportViewProps) {
  const [showAllIssues, setShowAllIssues] = useState(false)

  const criticalCount = result.recommendations.filter(r => r.status === "fail").length
  const warningCount = result.recommendations.filter(r => r.status === "warning").length
  const scoreInfo = getScoreLabel(result.overallScore)

  // Get quick wins (high impact failures)
  const quickWins = result.recommendations
    .filter(r => r.status === "fail" && r.impact === "High")
    .slice(0, 4)

  // Get category issue counts
  const categoryIssueCounts = result.categories.map(cat => ({
    ...cat,
    issueCount: result.recommendations.filter(
      r => r.category === cat.name && r.status !== "pass"
    ).length,
  }))

  // All issues for detailed view
  const allIssues = result.recommendations.filter(r => r.status !== "pass")
  const visibleIssues = showAllIssues ? allIssues : allIssues.slice(0, 5)

  return (
    <div className={cn("min-h-screen bg-gradient-to-b from-gray-50 to-gray-100/50", className)}>
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="hover:opacity-80 transition-opacity">
              <HostAILogo className="h-5" />
            </a>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-500">{result.domain}</span>
          </div>
          <a
            href="/"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            New Audit
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 pb-32">
        {/* Hero Card */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm shadow-gray-200/50 p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Score Section */}
            <div className="text-center lg:text-left shrink-0">
              <div className={cn("text-7xl font-bold tracking-tight", getScoreColor(result.overallScore))}>
                {result.overallScore}
                <span className="text-3xl text-gray-300 font-normal">/100</span>
              </div>
              <div className="text-gray-400 font-medium mt-2">Overall Health</div>
              <div className={cn("flex items-center gap-2 mt-2 justify-center lg:justify-start text-sm font-medium", scoreInfo.color)}>
                <span className={cn("w-2.5 h-2.5 rounded-full", scoreInfo.dot)} />
                {scoreInfo.label}
              </div>
            </div>

            {/* Details Section */}
            <div className="flex-1 border-t lg:border-t-0 lg:border-l border-gray-100/50 lg:pl-8 pt-6 lg:pt-0 w-full">
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Audit for{" "}
                <a
                  href={`https://${result.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {result.domain}
                </a>
              </h1>
              <p className="text-gray-500 mb-5 leading-relaxed">
                {result.summary}
              </p>
              <div className="flex gap-2 flex-wrap">
                {criticalCount > 0 && (
                  <span className="px-3 py-1.5 bg-red-50/80 text-red-600 rounded-md font-medium text-sm">
                    {criticalCount} Critical Issue{criticalCount !== 1 ? "s" : ""}
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="px-3 py-1.5 bg-yellow-50/80 text-yellow-600 rounded-md font-medium text-sm">
                    {warningCount} Warning{warningCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          {categoryIssueCounts.map(cat => (
            <CategoryCard
              key={cat.name}
              name={cat.name}
              score={cat.score}
              issueCount={cat.issueCount}
            />
          ))}
        </div>

        {/* Quick Wins */}
        {quickWins.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-50/80 rounded-md">
                <Sparkles className="w-4 h-4 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Quick Wins</h2>
                <p className="text-gray-400 text-sm">
                  High-impact fixes you can implement quickly.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              {quickWins.map((win, idx) => (
                <QuickWinCard key={idx} issue={win} />
              ))}
            </div>
          </section>
        )}

        {/* Detailed Analysis */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100/80 rounded-md">
              <FileText className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">All Issues</h2>
              <p className="text-gray-400 text-sm">
                Complete list of issues found.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {visibleIssues.map((issue, idx) => (
              <IssueRow key={idx} issue={issue} />
            ))}
          </div>

          {allIssues.length > 5 && (
            <button
              onClick={() => setShowAllIssues(!showAllIssues)}
              className="mt-4 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              {showAllIssues ? (
                <>
                  Show less <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Show all {allIssues.length} issues <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </section>

        {/* Sticky CTA Footer */}
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl bg-gray-900/95 backdrop-blur-sm text-white p-4 rounded-xl shadow-xl shadow-gray-900/20 flex flex-col sm:flex-row items-center justify-between gap-4 z-50">
          <div className="text-center sm:text-left">
            <p className="font-semibold">Ready to increase your bookings?</p>
            <p className="text-gray-400 text-sm">
              HostAI can help fix these issues automatically.
            </p>
          </div>
          <a
            href="https://hostai.app"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-5 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </main>
    </div>
  )
}
