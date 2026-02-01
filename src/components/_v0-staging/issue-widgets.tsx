import { useState } from "react"
import { AlertTriangle, CheckCircle2, ChevronDown, Info, XCircle } from "lucide-react"
import type { AuditIssue } from "@/lib/audit-types"
import type { IssueStyle } from "@/components/_v0-staging/admin-toolbar"

interface IssueWidgetsProps {
  issues: AuditIssue[]
  style: IssueStyle
}

const severityConfig = {
  critical: {
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/20",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-warning",
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

const getSeverityConfig = (severity: string | undefined) => {
  if (!severity || !(severity in severityConfig)) {
    return severityConfig.info // fallback to info
  }
  return severityConfig[severity as keyof typeof severityConfig]
}

export function IssueWidgets({ issues, style }: IssueWidgetsProps) {
  switch (style) {
    case "expandable":
      return <ExpandableStyle issues={issues} />
    case "inline":
      return <InlineStyle issues={issues} />
    case "cards":
      return <CardsStyle issues={issues} />
    case "table":
      return <TableStyle issues={issues} />
    default:
      return <ExpandableStyle issues={issues} />
  }
}

// Style 1: Expandable Accordion
function ExpandableStyle({ issues }: { issues: AuditIssue[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      {issues.map((issue) => {
        const config = getSeverityConfig(issue.severity)
        const Icon = config.icon
        const isExpanded = expanded === issue.id

        return (
          <div key={issue.id} className={`rounded-xl border ${config.border} ${config.bg}`}>
            <button
              onClick={() => setExpanded(isExpanded ? null : issue.id)}
              className="flex w-full items-start gap-3 p-4 text-left"
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.color}`} />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium">{issue.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">
                      {issue.category}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{issue.description}</p>
              </div>
            </button>
            {isExpanded && (
              <div className="space-y-3 border-t border-border/50 p-4 pl-12">
                <div>
                  <h4 className="mb-1 text-sm font-medium">Impact</h4>
                  <p className="text-sm text-muted-foreground">{issue.impact}</p>
                </div>
                <div>
                  <h4 className="mb-1 flex items-center gap-1 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    How to Fix
                  </h4>
                  <p className="text-sm text-muted-foreground">{issue.howToFix}</p>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Style 2: Inline Details
function InlineStyle({ issues }: { issues: AuditIssue[] }) {
  return (
    <div className="space-y-4">
      {issues.map((issue) => {
        const config = getSeverityConfig(issue.severity)
        const Icon = config.icon

        return (
          <div
            key={issue.id}
            className={`rounded-xl border ${config.border} p-4`}
          >
            <div className="flex items-start gap-3">
              <div className={`rounded-lg p-2 ${config.bg}`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="font-medium">{issue.title}</h3>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">
                    {issue.category}
                  </span>
                </div>
                <p className="mb-3 text-sm text-muted-foreground">{issue.description}</p>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium text-accent">
                    <CheckCircle2 className="h-3 w-3" />
                    Fix
                  </div>
                  <p className="text-sm text-muted-foreground">{issue.howToFix}</p>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Style 3: Masonry Cards
function CardsStyle({ issues }: { issues: AuditIssue[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {issues.map((issue) => {
        const config = getSeverityConfig(issue.severity)
        const Icon = config.icon

        return (
          <div
            key={issue.id}
            className="group rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className={`rounded-lg p-2 ${config.bg}`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
                {issue.category}
              </span>
            </div>
            <h3 className="mb-2 font-medium leading-tight">{issue.title}</h3>
            <p className="mb-3 text-sm leading-relaxed text-muted-foreground line-clamp-2">
              {issue.description}
            </p>
            <div className="border-t border-border pt-3">
              <p className="text-xs text-accent line-clamp-2">
                Fix: {issue.howToFix}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Style 4: Data Table
function TableStyle({ issues }: { issues: AuditIssue[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Severity
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Issue
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground md:table-cell">
              Category
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground lg:table-cell">
              Recommended Fix
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {issues.map((issue) => {
            const config = getSeverityConfig(issue.severity)
            const Icon = config.icon

            return (
              <tr key={issue.id} className="hover:bg-muted/30">
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <span className={`text-sm font-medium capitalize ${config.color}`}>
                      {issue.severity}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{issue.title}</div>
                  <div className="text-sm text-muted-foreground line-clamp-1">
                    {issue.description}
                  </div>
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 md:table-cell">
                  <span className="rounded-full bg-muted px-2 py-1 text-xs capitalize">
                    {issue.category}
                  </span>
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {issue.howToFix}
                  </p>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
