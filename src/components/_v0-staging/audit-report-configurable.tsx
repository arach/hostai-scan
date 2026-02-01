"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Share2,
  Zap,
} from "lucide-react"
import type { AuditResult, QuickWin } from "@/lib/audit-types"
import { trackReportOpen, trackCTAClick, buildEliteGenURL } from "@/lib/tracking"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/_v0-staging/ui/tabs"
import {
  AdminToolbar,
  type WidgetStyle,
  type ScoreStyle,
  type CategoryStyle,
  type IssueStyle,
} from "@/components/_v0-staging/admin-toolbar"
import { ScoreWidget } from "@/components/_v0-staging/score-widgets"
import { CategoryWidgets } from "@/components/_v0-staging/category-widgets"
import { IssueWidgets } from "@/components/_v0-staging/issue-widgets"

interface AuditReportConfigurableProps {
  result: AuditResult
  showAdminToolbar?: boolean
  // External style controls (from DevPanel)
  scoreStyle?: ScoreStyle
  categoryStyle?: CategoryStyle
  issueStyle?: IssueStyle
  onScoreStyleChange?: (style: ScoreStyle) => void
  onCategoryStyleChange?: (style: CategoryStyle) => void
  onIssueStyleChange?: (style: IssueStyle) => void
}

export function AuditReportConfigurable({ 
  result, 
  showAdminToolbar = true,
  scoreStyle: externalScoreStyle,
  categoryStyle: externalCategoryStyle,
  issueStyle: externalIssueStyle,
  onScoreStyleChange,
  onCategoryStyleChange,
  onIssueStyleChange,
}: AuditReportConfigurableProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [widgetStyle, setWidgetStyle] = useState<WidgetStyle>("default")
  const [internalScoreStyle, setInternalScoreStyle] = useState<ScoreStyle>("circle")
  const [internalCategoryStyle, setInternalCategoryStyle] = useState<CategoryStyle>("cards")
  const [internalIssueStyle, setInternalIssueStyle] = useState<IssueStyle>("expandable")
  const [scoreStyle, setScoreStyle] = useState<ScoreStyle>(externalScoreStyle ?? internalScoreStyle)
  const [categoryStyle, setCategoryStyle] = useState<CategoryStyle>(externalCategoryStyle ?? internalCategoryStyle)
  const [issueStyle, setIssueStyle] = useState<IssueStyle>(externalIssueStyle ?? internalIssueStyle)

  const handleScoreStyleChange = (style: ScoreStyle) => {
    if (onScoreStyleChange) onScoreStyleChange(style)
    else setInternalScoreStyle(style)
  }
  const handleCategoryStyleChange = (style: CategoryStyle) => {
    if (onCategoryStyleChange) onCategoryStyleChange(style)
    else setInternalCategoryStyle(style)
  }
  const handleIssueStyleChange = (style: IssueStyle) => {
    if (onIssueStyleChange) onIssueStyleChange(style)
    else setInternalIssueStyle(style)
  }

  const expiresDate = new Date(result.expiresAt)
  const daysRemaining = Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

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
      } catch {
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

  const filteredIssues = activeCategory
    ? result.issues.filter((i) => i.category === activeCategory)
    : result.issues

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
            Generated on{" "}
            {new Date(result.createdAt).toLocaleDateString("en-US", {
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

      {/* Overall Score Section - Changes based on widgetStyle */}
      <div className={`mb-8 rounded-xl border border-border bg-card p-6 lg:p-8 ${
        widgetStyle === "dashboard" ? "bg-gradient-to-br from-card to-muted/30" : ""
      }`}>
        <div className={`flex flex-col items-center gap-6 ${
          widgetStyle === "minimal" ? "lg:flex-row lg:gap-8" : "lg:flex-row lg:gap-12"
        }`}>
          <ScoreWidget score={result.overallScore} style={scoreStyle} label="Overall Health" />
          <div className="flex-1 text-center lg:text-left">
            <h2 className={`mb-2 font-semibold ${widgetStyle === "minimal" ? "text-lg" : "text-xl"}`}>
              {widgetStyle === "detailed" ? "Complete Website Health Assessment" : "Overall Website Health"}
            </h2>
            <p className={`mb-4 max-w-xl text-muted-foreground ${widgetStyle === "minimal" ? "text-sm" : ""}`}>
              {result.overallScore >= 80
                ? "Your website is performing well! There are still opportunities to improve guest conversions."
                : result.overallScore >= 50
                  ? "Your website has several issues that may be affecting bookings. Focus on the critical fixes below."
                  : "Your website needs significant improvements. Multiple issues are likely blocking potential bookings."}
            </p>
            {widgetStyle !== "minimal" && (
              <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                <StatBadge
                  label="Issues Found"
                  value={result.issues.length}
                  variant={result.issues.filter((i) => i.severity === "critical").length > 0 ? "destructive" : "default"}
                />
                <StatBadge
                  label="Critical"
                  value={result.issues.filter((i) => i.severity === "critical").length}
                  variant="destructive"
                />
                <StatBadge
                  label="Warnings"
                  value={result.issues.filter((i) => i.severity === "warning").length}
                  variant="warning"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Scores - Using CategoryWidgets */}
      <div className="mb-8">
        <CategoryWidgets
          categories={result.categories}
          style={categoryStyle}
          activeCategory={activeCategory}
          onCategoryClick={setActiveCategory}
        />
      </div>

      {/* Quick Wins Section */}
      {result.quickWins.length > 0 && widgetStyle !== "minimal" && (
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-semibold">Quick Wins</h2>
          </div>
          <p className="mb-4 text-muted-foreground">
            High-impact fixes you can implement quickly to improve your booking conversion rate.
          </p>
          <div className={`grid gap-4 ${
            widgetStyle === "detailed" ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"
          }`}>
            {result.quickWins.map((win) => (
              <QuickWinCard key={win.id} win={win} detailed={widgetStyle === "detailed"} />
            ))}
          </div>
        </div>
      )}

      {/* Detailed Issues - Using IssueWidgets */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">
          {activeCategory
            ? `${result.categories.find((c) => c.id === activeCategory)?.name} Issues`
            : "Detailed Analysis"}
        </h2>
        {activeCategory ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="mb-4"
              onClick={() => setActiveCategory(null)}
            >
              View All Issues
            </Button>
            <IssueWidgets issues={filteredIssues} style={issueStyle} />
          </>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="all">All Issues ({result.issues.length})</TabsTrigger>
              <TabsTrigger value="critical">
                Critical ({result.issues.filter((i) => i.severity === "critical").length})
              </TabsTrigger>
              <TabsTrigger value="warning">
                Warnings ({result.issues.filter((i) => i.severity === "warning").length})
              </TabsTrigger>
              <TabsTrigger value="info">
                Info ({result.issues.filter((i) => i.severity === "info").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <IssueWidgets issues={result.issues} style={issueStyle} />
            </TabsContent>
            <TabsContent value="critical">
              <IssueWidgets issues={result.issues.filter((i) => i.severity === "critical")} style={issueStyle} />
            </TabsContent>
            <TabsContent value="warning">
              <IssueWidgets issues={result.issues.filter((i) => i.severity === "warning")} style={issueStyle} />
            </TabsContent>
            <TabsContent value="info">
              <IssueWidgets issues={result.issues.filter((i) => i.severity === "info")} style={issueStyle} />
            </TabsContent>
          </Tabs>
        )}
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

      {/* Admin Toolbar */}
      {showAdminToolbar && (
        <AdminToolbar
          widgetStyle={widgetStyle}
          scoreStyle={scoreStyle}
          categoryStyle={categoryStyle}
          issueStyle={issueStyle}
          onWidgetStyleChange={setWidgetStyle}
          onScoreStyleChange={handleScoreStyleChange}
          onCategoryStyleChange={handleCategoryStyleChange}
          onIssueStyleChange={handleIssueStyleChange}
        />
      )}
    </div>
  )
}

function StatBadge({
  label,
  value,
  variant = "default",
}: {
  label: string
  value: number
  variant?: "default" | "destructive" | "warning"
}) {
  const colors = {
    default: "bg-secondary text-secondary-foreground",
    destructive: "bg-destructive/10 text-destructive",
    warning: "bg-warning/10 text-warning",
  }

  return (
    <div className={`rounded-lg px-3 py-1.5 ${colors[variant]}`}>
      <span className="font-semibold">{value}</span>
      <span className="ml-1 text-sm opacity-80">{label}</span>
    </div>
  )
}

function QuickWinCard({ win, detailed = false }: { win: QuickWin; detailed?: boolean }) {
  const impactColors = {
    high: "bg-accent/10 text-accent",
    medium: "bg-warning/10 text-warning",
    low: "bg-muted text-muted-foreground",
  }
  const effortColors = {
    low: "bg-accent/10 text-accent",
    medium: "bg-warning/10 text-warning",
    high: "bg-destructive/10 text-destructive",
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="font-medium">{win.title}</h3>
        <Zap className="h-4 w-4 shrink-0 text-accent" />
      </div>
      <p className={`mb-3 text-sm text-muted-foreground ${detailed ? "" : "line-clamp-2"}`}>
        {win.description}
      </p>
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
