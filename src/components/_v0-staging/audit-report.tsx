import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Copy,
  Download, 
  ExternalLink,
  Gauge,
  Info,
  Search,
  Share2,
  Shield,
  Smartphone,
  Star,
  Zap,
  XCircle
} from "lucide-react"
import type { AuditResult, AuditCategory, AuditIssue, QuickWin } from "@/lib/audit-types"
import { trackReportOpen, trackCTAClick, buildEliteGenURL } from "@/lib/tracking"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/_v0-staging/ui/tabs"

interface AuditReportProps {
  result: AuditResult
}

const categoryIcons: Record<string, typeof Gauge> = {
  performance: Gauge,
  seo: Search,
  trust: Shield,
  mobile: Smartphone,
  conversion: Star,
}

export function AuditReport({ result }: AuditReportProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  const expiresDate = new Date(result.expiresAt)
  const daysRemaining = Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  // Track report open on mount
  useEffect(() => {
    const tracking = (result as AuditResult & { tracking?: { utm_source?: string; utm_campaign?: string } }).tracking
    trackReportOpen(result.id, result.domain, {
      source: tracking?.utm_source,
      campaign: tracking?.utm_campaign,
    })
  }, [result])

  const handleCTAClick = (ctaType: string) => {
    const tracking = (result as AuditResult & { tracking?: { utm_source?: string; utm_campaign?: string } }).tracking
    trackCTAClick(result.id, result.domain, ctaType, {
      source: tracking?.utm_source,
      campaign: tracking?.utm_campaign,
    })
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/audit?domain=${result.domain}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Website Audit Report - ${result.domain}`,
          text: `Check out this website audit report for ${result.domain}. Overall score: ${result.overallScore}/100`,
          url,
        })
      } catch (err) {
        // User cancelled or share failed, fall back to copy
        copyToClipboard(url)
      }
    } else {
      copyToClipboard(url)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getEliteGenURL = (path: string, params: Record<string, string | undefined> = {}) => {
    return buildEliteGenURL(path, {
      domain: result.domain,
      score: String(result.overallScore),
      ...params,
    })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Report Header */}
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
              Website Audit Report
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Expires in {daysRemaining} days
            </span>
          </div>
          <h1 className="mb-1 text-2xl font-bold lg:text-3xl">{result.domain}</h1>
          <p className="text-muted-foreground">
            Generated on {new Date(result.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={handleShare}>
            {copied ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Link Copied!
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Share Report
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleCTAClick("pdf_download")}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button size="sm" asChild onClick={() => handleCTAClick("get_full_analysis")}>
            <Link href={getEliteGenURL("/signup")} target="_blank">
              Get Full Analysis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Overall Score */}
      <div className="mb-8 rounded-xl border border-border bg-card p-6 lg:p-8">
        <div className="flex flex-col items-center gap-6 lg:flex-row lg:gap-12">
          <div className="relative">
            <ScoreCircle score={result.overallScore} size={160} />
          </div>
          <div className="flex-1 text-center lg:text-left">
            <h2 className="mb-2 text-xl font-semibold">Overall Website Health</h2>
            <p className="mb-4 max-w-xl text-muted-foreground">
              {result.overallScore >= 80
                ? "Your website is performing well! There are still opportunities to improve guest conversions."
                : result.overallScore >= 50
                ? "Your website has several issues that may be affecting bookings. Focus on the critical fixes below."
                : "Your website needs significant improvements. Multiple issues are likely blocking potential bookings."}
            </p>
            <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
              <StatBadge 
                label="Issues Found" 
                value={result.issues.length} 
                variant={result.issues.filter(i => i.severity === "critical").length > 0 ? "destructive" : "default"} 
              />
              <StatBadge 
                label="Critical" 
                value={result.issues.filter(i => i.severity === "critical").length}
                variant="destructive"
              />
              <StatBadge 
                label="Warnings" 
                value={result.issues.filter(i => i.severity === "warning").length}
                variant="warning"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Scores */}
      <div className="mb-8 grid gap-4 md:grid-cols-5">
        {result.categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            isActive={activeCategory === category.id}
            onClick={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
          />
        ))}
      </div>

      {/* Quick Wins Section */}
      {result.quickWins.length > 0 && (
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-semibold">Quick Wins</h2>
          </div>
          <p className="mb-4 text-muted-foreground">
            High-impact fixes you can implement quickly to improve your booking conversion rate.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {result.quickWins.map((win) => (
              <QuickWinCard key={win.id} win={win} />
            ))}
          </div>
        </div>
      )}

      {/* Detailed Issues */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Detailed Analysis</h2>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="all">
              All Issues ({result.issues.length})
            </TabsTrigger>
            <TabsTrigger value="critical">
              Critical ({result.issues.filter(i => i.severity === "critical").length})
            </TabsTrigger>
            <TabsTrigger value="warning">
              Warnings ({result.issues.filter(i => i.severity === "warning").length})
            </TabsTrigger>
            <TabsTrigger value="info">
              Info ({result.issues.filter(i => i.severity === "info").length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {result.issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </TabsContent>
          
          <TabsContent value="critical" className="space-y-4">
            {result.issues.filter(i => i.severity === "critical").map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </TabsContent>
          
          <TabsContent value="warning" className="space-y-4">
            {result.issues.filter(i => i.severity === "warning").map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </TabsContent>
          
          <TabsContent value="info" className="space-y-4">
            {result.issues.filter(i => i.severity === "info").map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* CTA Section */}
      <div className="rounded-xl border border-accent bg-accent/5 p-6 text-center lg:p-8">
        <h2 className="mb-2 text-xl font-semibold">Ready to increase your bookings?</h2>
        <p className="mb-6 text-muted-foreground">
          EliteGen helps short-term rental owners optimize their online presence and drive more direct bookings.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild onClick={() => handleCTAClick("free_trial")}>
            <Link href={getEliteGenURL("/signup")} target="_blank">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild onClick={() => handleCTAClick("schedule_demo")}>
            <Link href={getEliteGenURL("/demo")} target="_blank">
              Schedule a Demo
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

function ScoreCircle({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const color = score >= 80 ? "text-accent" : score >= 50 ? "text-warning" : "text-destructive"
  const bgColor = score >= 80 ? "stroke-accent/20" : score >= 50 ? "stroke-warning/20" : "stroke-destructive/20"
  const strokeColor = score >= 80 ? "stroke-accent" : score >= 50 ? "stroke-warning" : "stroke-destructive"

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="rotate-[-90deg]" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="8"
          className={bgColor}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className={strokeColor}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold ${color}`}>{score}</span>
        <span className="text-sm text-muted-foreground">/ 100</span>
      </div>
    </div>
  )
}

function StatBadge({ 
  label, 
  value, 
  variant = "default" 
}: { 
  label: string
  value: number
  variant?: "default" | "destructive" | "warning"
}) {
  const colors = {
    default: "bg-secondary text-secondary-foreground",
    destructive: "bg-destructive/10 text-destructive",
    warning: "bg-warning/10 text-warning-foreground",
  }

  return (
    <div className={`rounded-lg px-3 py-1.5 ${colors[variant]}`}>
      <span className="font-semibold">{value}</span>
      <span className="ml-1 text-sm opacity-80">{label}</span>
    </div>
  )
}

function CategoryCard({ 
  category, 
  isActive, 
  onClick 
}: { 
  category: AuditCategory
  isActive: boolean
  onClick: () => void 
}) {
  const Icon = categoryIcons[category.id] || Gauge
  const statusColors = {
    good: "border-accent bg-accent/5",
    warning: "border-warning bg-warning/5",
    critical: "border-destructive bg-destructive/5",
  }
  const scoreColors = {
    good: "text-accent",
    warning: "text-warning-foreground",
    critical: "text-destructive",
  }

  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-all hover:shadow-md ${
        isActive ? statusColors[category.status] : "border-border bg-card"
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
      <div className={`text-2xl font-bold ${scoreColors[category.status]}`}>
        {category.score}
        <span className="text-sm font-normal text-muted-foreground">/100</span>
      </div>
    </button>
  )
}

function QuickWinCard({ win }: { win: QuickWin }) {
  const impactColors = {
    high: "bg-accent/10 text-accent",
    medium: "bg-warning/10 text-warning-foreground",
    low: "bg-muted text-muted-foreground",
  }
  const effortColors = {
    low: "bg-accent/10 text-accent",
    medium: "bg-warning/10 text-warning-foreground",
    high: "bg-destructive/10 text-destructive",
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="font-medium">{win.title}</h3>
        <Zap className="h-4 w-4 shrink-0 text-accent" />
      </div>
      <p className="mb-3 text-sm text-muted-foreground">{win.description}</p>
      <div className="flex gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${impactColors[win.impact]}`}>
          {win.impact} impact
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${effortColors[win.effort]}`}>
          {win.effort} effort
        </span>
      </div>
    </div>
  )
}

function IssueCard({ issue }: { issue: AuditIssue }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const severityConfig = {
    critical: {
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
      border: "border-destructive/20",
    },
    warning: {
      icon: AlertTriangle,
      color: "text-warning-foreground",
      bg: "bg-warning/10",
      border: "border-warning/20",
    },
    info: {
      icon: Info,
      color: "text-muted-foreground",
      bg: "bg-muted",
      border: "border-border",
    },
  }

  const config = severityConfig[issue.severity]
  const Icon = config.icon

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} p-4`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-start gap-3 text-left"
      >
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.color}`} />
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium">{issue.title}</h3>
            <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">
              {issue.category}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{issue.description}</p>
        </div>
      </button>
      
      {isExpanded && (
        <div className="mt-4 space-y-3 border-t border-border pt-4 pl-8">
          <div>
            <h4 className="mb-1 text-sm font-medium">Impact</h4>
            <p className="text-sm text-muted-foreground">{issue.impact}</p>
          </div>
          <div>
            <h4 className="mb-1 text-sm font-medium flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              How to Fix
            </h4>
            <p className="text-sm text-muted-foreground">{issue.howToFix}</p>
          </div>
        </div>
      )}
    </div>
  )
}
