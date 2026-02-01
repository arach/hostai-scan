"use client"

import { useState, useEffect, lazy, Suspense } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { ThemePicker } from "@/components/theme-picker"
import type { AuditResult } from "@/types/audit"

// Sample audit result for testing
const SAMPLE_RESULT: AuditResult = {
  domain: "beachside-retreats.com",
  timestamp: new Date().toISOString(),
  overallScore: 64,
  projectedScore: 89,
  monthlyRevenueLoss: 2450,
  auditId: "sample-audit-123",
  summary: "Your site has several issues that may be costing you bookings. Focus on conversion optimization and trust signals.",
  categories: [
    { name: "Conversion", score: 45, weight: 35, description: "Booking flow and user experience" },
    { name: "Performance", score: 78, weight: 20, description: "Page load speed and core web vitals" },
    { name: "Trust", score: 52, weight: 20, description: "Reviews, certifications, and credibility" },
    { name: "Content", score: 71, weight: 15, description: "Property descriptions and media quality" },
    { name: "SEO", score: 68, weight: 7, description: "Search engine visibility" },
    { name: "Security", score: 95, weight: 3, description: "SSL and data protection" },
  ],
  recommendations: [
    { title: "Add prominent booking CTA above the fold", description: "Visitors shouldn't have to scroll to find how to book.", status: "fail", impact: "High", category: "Conversion" },
    { title: "Display pricing upfront", description: "Show nightly rates on property cards to set expectations early.", status: "fail", impact: "High", category: "Conversion" },
    { title: "Booking System", description: "No booking widget detected - consider adding an integrated booking system", status: "fail", impact: "High", category: "Conversion" },
    { title: "Booking Friction", description: "High friction (6 estimated clicks to book) - aim for 3 clicks or fewer", status: "fail", impact: "High", category: "Conversion" },
    { title: "Add guest reviews section", description: "No visible reviews. Social proof is critical for bookings.", status: "fail", impact: "High", category: "Trust" },
    { title: "Display trust badges", description: "Add Superhost, verified host, or security badges.", status: "warning", impact: "Medium", category: "Trust" },
    { title: "Pricing Display", description: "No pricing found on page - show rates upfront to set expectations", status: "warning", impact: "Medium", category: "Conversion" },
    { title: "SSL certificate valid", description: "Your site uses HTTPS correctly.", status: "pass", impact: "High", category: "Security" },
    { title: "Mobile responsive design", description: "Site adapts well to mobile viewports.", status: "pass", impact: "High", category: "Performance" },
    { title: "Optimize hero image", description: "Main image is 2.4MB. Compress to under 200KB.", status: "warning", impact: "Medium", category: "Performance" },
    { title: "Enable browser caching", description: "Static assets not cached effectively.", status: "warning", impact: "Medium", category: "Performance" },
    { title: "Add structured data", description: "Rich snippets can improve search click-through rates.", status: "warning", impact: "Medium", category: "SEO" },
    { title: "Meta descriptions present", description: "All pages have unique meta descriptions.", status: "pass", impact: "Medium", category: "SEO" },
    { title: "Add more property photos", description: "Only 8 photos found. Aim for 20+ high-quality images.", status: "fail", impact: "High", category: "Content" },
    { title: "Property descriptions detailed", description: "Good use of amenity lists and local information.", status: "pass", impact: "Medium", category: "Content" },
  ],
  competitors: [
    { name: "Coastal Retreats", rating: 4.9, rank: 1 },
    { name: "Beach House Pro", rating: 4.7, rank: 2 },
  ],
}

// Lazy load the variants
const PublicReportView = lazy(() => import("@/components/report/public-report-view").then(m => ({ default: m.PublicReportView })))
const ReportVariantB = lazy(() => import("@/components/report/variants/report-variant-b").then(m => ({ default: m.ReportVariantB })))
const ReportVariantC = lazy(() => import("@/components/report/variants/report-variant-c").then(m => ({ default: m.ReportVariantC })))

const VARIANTS = [
  { id: "current", name: "Current", description: "The current implementation" },
  { id: "b", name: "Variant B", description: "Clean & Subtle" },
  { id: "c", name: "Variant C", description: "Modern Analytics" },
]

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Loading variant...</p>
      </div>
    </div>
  )
}

function ErrorFallback({ variant }: { variant: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-xl shadow-sm max-w-md">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-500 text-xl">!</span>
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">Variant Not Found</h3>
        <p className="text-gray-500 text-sm">
          {variant} hasn't been created yet. The agents are still working on it.
        </p>
      </div>
    </div>
  )
}

export default function ReportVariantsPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loadErrors, setLoadErrors] = useState<Record<string, boolean>>({})

  const currentVariant = VARIANTS[currentIndex]

  const goNext = () => {
    setCurrentIndex((i) => (i + 1) % VARIANTS.length)
  }

  const goPrev = () => {
    setCurrentIndex((i) => (i - 1 + VARIANTS.length) % VARIANTS.length)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext()
      if (e.key === "ArrowLeft") goPrev()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const renderVariant = () => {
    const ErrorBoundary = ({ children, variantId }: { children: React.ReactNode; variantId: string }) => {
      if (loadErrors[variantId]) {
        return <ErrorFallback variant={variantId} />
      }
      return <>{children}</>
    }

    switch (currentVariant.id) {
      case "current":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <PublicReportView result={SAMPLE_RESULT} />
          </Suspense>
        )
      case "b":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ErrorBoundary variantId="b">
              <ReportVariantB result={SAMPLE_RESULT} />
            </ErrorBoundary>
          </Suspense>
        )
      case "c":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ErrorBoundary variantId="c">
              <ReportVariantC result={SAMPLE_RESULT} />
            </ErrorBoundary>
          </Suspense>
        )
      default:
        return <ErrorFallback variant={currentVariant.id} />
    }
  }

  return (
    <div className="relative">
      {/* Floating control bar */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-card/90 backdrop-blur-sm rounded-full shadow-lg border border-border p-1.5">
        <button
          onClick={goPrev}
          className="p-2 hover:bg-muted rounded-full transition-colors"
          title="Previous (Left Arrow)"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex items-center gap-2 px-3">
          {VARIANTS.map((variant, idx) => (
            <button
              key={variant.id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? "bg-primary w-6"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              title={variant.name}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          className="p-2 hover:bg-muted rounded-full transition-colors"
          title="Next (Right Arrow)"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Variant label + Theme picker */}
      <div className="fixed top-4 right-4 z-[100] flex items-start gap-2">
        <ThemePicker />
        <div className="bg-card/90 backdrop-blur-sm rounded-lg shadow-lg border border-border px-4 py-2 w-40">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Viewing</div>
          <div className="font-semibold text-foreground truncate">{currentVariant.name}</div>
          <div className="text-xs text-muted-foreground truncate">{currentVariant.description}</div>
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="fixed bottom-4 right-4 z-[100] text-xs text-muted-foreground bg-card/80 backdrop-blur-sm rounded px-2 py-1 border border-border/50">
        Use arrow keys to navigate
      </div>

      {/* Render the current variant */}
      {renderVariant()}
    </div>
  )
}
