"use client"

import { useState } from "react"
import { PublicReportView } from "@/components/report"
import type { AuditResult } from "@/types/audit"

// Sample audit result for testing
const SAMPLE_RESULT: AuditResult = {
  domain: "beachside-retreats.com",
  timestamp: new Date().toISOString(),
  overallScore: 62,
  projectedScore: 89,
  monthlyRevenueLoss: 2450,
  auditId: "sample-audit-123",
  summary: "Your site has critical conversion blockers compared to top performers in your market.",
  categories: [
    { name: "Conversion", score: 55, weight: 35, description: "Booking flow and user experience" },
    { name: "Performance", score: 72, weight: 20, description: "Page load speed and core web vitals" },
    { name: "Trust", score: 48, weight: 20, description: "Reviews, certifications, and credibility" },
    { name: "Content", score: 68, weight: 15, description: "Property descriptions and media quality" },
    { name: "SEO", score: 75, weight: 7, description: "Search engine visibility" },
    { name: "Security", score: 90, weight: 3, description: "SSL and data protection" },
  ],
  recommendations: [
    { title: "Add prominent booking CTA above the fold", description: "Visitors shouldn't have to scroll to find how to book.", status: "fail", impact: "High", category: "Conversion" },
    { title: "Display pricing upfront", description: "Show nightly rates on property cards to set expectations early.", status: "fail", impact: "High", category: "Conversion" },
    { title: "Reduce steps to checkout", description: "Currently 5 clicks to payment. Best-in-class is 3.", status: "warning", impact: "High", category: "Conversion" },
    { title: "Add guest reviews section", description: "No visible reviews. Social proof is critical for bookings.", status: "fail", impact: "High", category: "Trust" },
    { title: "Display trust badges", description: "Add Superhost, verified host, or security badges.", status: "warning", impact: "Medium", category: "Trust" },
    { title: "SSL certificate valid", description: "Your site uses HTTPS correctly.", status: "pass", impact: "High", category: "Security" },
    { title: "Mobile responsive design", description: "Site adapts well to mobile viewports.", status: "pass", impact: "High", category: "Performance" },
    { title: "Optimize hero image", description: "Main image is 2.4MB. Compress to under 200KB.", status: "fail", impact: "Medium", category: "Performance" },
    { title: "Enable browser caching", description: "Static assets not cached effectively.", status: "warning", impact: "Medium", category: "Performance" },
    { title: "Add structured data for vacation rentals", description: "Rich snippets can improve search click-through rates.", status: "warning", impact: "Medium", category: "SEO" },
    { title: "Meta descriptions present", description: "All pages have unique meta descriptions.", status: "pass", impact: "Medium", category: "SEO" },
    { title: "Add more property photos", description: "Only 8 photos found. Aim for 20+ high-quality images.", status: "fail", impact: "High", category: "Content" },
    { title: "Property descriptions are detailed", description: "Good use of amenity lists and local information.", status: "pass", impact: "Medium", category: "Content" },
  ],
  competitors: [
    { name: "Coastal Retreats", rating: 4.9, rank: 1 },
    { name: "Beach House Pro", rating: 4.7, rank: 2 },
    { name: "Sunset Stays", rating: 4.6, rank: 3 },
  ],
}

// Score presets for quick testing (matches elitegen thresholds)
const SCORE_PRESETS = [
  { label: "Urgent", score: 35 },
  { label: "Needs Work", score: 58 },
  { label: "Good", score: 82 },
]

export default function ReportDevPage() {
  const [score, setScore] = useState(62)
  const [showControls, setShowControls] = useState(true)

  // Create a result with the adjusted score
  const result: AuditResult = {
    ...SAMPLE_RESULT,
    overallScore: score,
    projectedScore: Math.min(100, score + 27),
  }

  return (
    <div className="relative">
      {/* Floating control panel */}
      <div className="fixed bottom-4 right-4 z-50">
        {showControls ? (
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-72">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                  DEV
                </span>
                <span className="text-sm font-medium text-gray-700">Report Preview</span>
              </div>
              <button
                onClick={() => setShowControls(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Score slider */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Score</span>
                <span className="font-mono text-gray-900">{score}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
              />
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1">
              {SCORE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setScore(preset.score)}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    score === preset.score
                      ? "bg-violet-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowControls(true)}
            className="bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            DEV
          </button>
        )}
      </div>

      {/* The actual report view */}
      <PublicReportView result={result} />
    </div>
  )
}
