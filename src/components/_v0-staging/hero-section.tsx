import React from "react"

import { ArrowRight, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface HeroSectionProps {
  domain: string
  setDomain: (domain: string) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  error: string
}

export function HeroSection({ domain, setDomain, onSubmit, isLoading, error }: HeroSectionProps) {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-muted-foreground">
          <span className="flex h-2 w-2 rounded-full bg-accent" />
          Free Website Audit for STR Properties
        </div>
        
        <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Discover what&apos;s blocking your{" "}
          <span className="text-accent">bookings</span>
        </h1>
        
        <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg text-muted-foreground lg:text-xl">
          Get a comprehensive, AI-powered audit of your short-term rental website. 
          Uncover conversion issues, SEO problems, and trust gaps in under 60 seconds.
        </p>

        <form onSubmit={onSubmit} className="mx-auto max-w-xl">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter your website domain..."
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="h-12 pl-10 text-base"
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              size="lg" 
              className="h-12 px-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Start Free Audit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-destructive">{error}</p>
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            No signup required. Your report will be ready in about 60 seconds.
          </p>
        </form>
      </div>
    </section>
  )
}
