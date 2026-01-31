"use client"

import Link from "next/link"
import { Activity, Gauge, Palette, FlaskConical } from "lucide-react"

const devTools = [
  {
    href: "/dev/scanner",
    icon: <Activity className="h-5 w-5" />,
    name: "Scanner Preview",
    description: "Test and preview the multi-phase scanner animations",
  },
  {
    href: "/admin",
    icon: <Gauge className="h-5 w-5" />,
    name: "Admin Dashboard",
    description: "View and manage audit reports",
  },
]

export default function DevIndexPage() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <FlaskConical className="h-5 w-5 text-warning" />
            <span className="text-xs font-mono bg-warning/20 text-warning px-2 py-0.5 rounded">
              DEV TOOLS
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Developer Tools</h1>
          <p className="text-muted-foreground mt-1">
            Internal tools for testing and previewing components
          </p>
        </div>

        {/* Tool Grid */}
        <div className="grid gap-4">
          {devTools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="block p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  {tool.icon}
                </div>
                <div className="flex-1">
                  <h2 className="font-medium text-foreground group-hover:text-accent transition-colors">
                    {tool.name}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {tool.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            These tools are only available in development mode
          </p>
        </div>
      </div>
    </main>
  )
}
