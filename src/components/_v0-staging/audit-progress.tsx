"use client"

import { Check, Loader2 } from "lucide-react"
import type { AuditProgress as AuditProgressType } from "@/lib/audit-types"
import { Progress } from "@/components/_v0-staging/ui/progress"

interface AuditProgressProps {
  domain: string
  progress: AuditProgressType
}

export function AuditProgress({ domain, progress }: AuditProgressProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Auditing {domain}</h1>
        <p className="text-muted-foreground">{progress.message}</p>
      </div>

      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{progress.progress}%</span>
        </div>
        <Progress value={progress.progress} className="h-2" />
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 font-semibold">Audit Checks</h3>
        <div className="space-y-3">
          {[
            "Website reachable",
            "Performance metrics",
            "SEO analysis",
            "Trust signals",
            "Mobile experience",
            "Conversion audit",
            "Score calculation",
          ].map((check, index) => {
            const isCompleted = progress.completedChecks.includes(check)
            const isActive = !isCompleted && progress.completedChecks.length === index
            
            return (
              <div
                key={check}
                className={`flex items-center gap-3 ${
                  isCompleted ? "text-foreground" : isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                    <Check className="h-3 w-3 text-accent-foreground" />
                  </div>
                ) : isActive ? (
                  <div className="flex h-5 w-5 items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted" />
                )}
                <span className="text-sm">{check}</span>
              </div>
            )
          })}
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        This typically takes 30-60 seconds. Please don&apos;t close this page.
      </p>
    </div>
  )
}
