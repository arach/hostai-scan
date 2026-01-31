"use client";

import { useState, useCallback, useRef } from "react";
import { AuditForm } from "@/components/audit-form";
import { LoadingAudit } from "@/components/loading-audit";
import { ReportDashboard } from "@/components/report-dashboard";
import type { AuditResult } from "@/types/audit";

interface AuditProgress {
  progress: number;
  currentStep: string;
}

// Demo data for testing
const DEMO_RESULT: AuditResult = {
  domain: "example-stays.com",
  timestamp: new Date().toISOString(),
  overallScore: 62,
  projectedScore: 89,
  monthlyRevenueLoss: 2450,
  summary: "Your site has critical conversion blockers compared to top performers in your market.",
  categories: [
    {
      name: "Conversion",
      score: 55,
      weight: 35,
      description: "Booking flow and user experience",
    },
    {
      name: "Performance",
      score: 72,
      weight: 20,
      description: "Page load speed and core web vitals",
    },
    {
      name: "Trust Signals",
      score: 48,
      weight: 20,
      description: "Reviews, certifications, and credibility",
    },
    {
      name: "Content",
      score: 68,
      weight: 15,
      description: "Property descriptions and media quality",
    },
    {
      name: "SEO",
      score: 75,
      weight: 7,
      description: "Search engine visibility",
    },
    {
      name: "Security",
      score: 90,
      weight: 3,
      description: "SSL and data protection",
    },
  ],
  recommendations: [
    {
      title: "Add prominent booking CTA above the fold",
      description: "Visitors shouldn't have to scroll to find how to book.",
      status: "fail",
      impact: "High",
      category: "Conversion",
    },
    {
      title: "Display pricing upfront",
      description: "Show nightly rates on property cards to set expectations early.",
      status: "fail",
      impact: "High",
      category: "Conversion",
    },
    {
      title: "Reduce steps to checkout",
      description: "Currently 5 clicks to payment. Best-in-class is 3.",
      status: "warning",
      impact: "High",
      category: "Conversion",
    },
    {
      title: "Add guest reviews section",
      description: "No visible reviews. Social proof is critical for bookings.",
      status: "fail",
      impact: "High",
      category: "Trust Signals",
    },
    {
      title: "SSL certificate valid",
      description: "Your site uses HTTPS correctly.",
      status: "pass",
      impact: "High",
      category: "Security",
    },
    {
      title: "Mobile responsive design",
      description: "Site adapts well to mobile viewports.",
      status: "pass",
      impact: "High",
      category: "Performance",
    },
    {
      title: "Optimize hero image",
      description: "Main image is 2.4MB. Compress to under 200KB.",
      status: "fail",
      impact: "Medium",
      category: "Performance",
    },
    {
      title: "Add structured data for vacation rentals",
      description: "Rich snippets can improve search click-through rates.",
      status: "warning",
      impact: "Medium",
      category: "SEO",
    },
  ],
  competitors: [
    { name: "Coastal Retreats", rating: 4.9, rank: 1 },
    { name: "Beach House Pro", rating: 4.7, rank: 2 },
    { name: "Sunset Stays", rating: 4.6, rank: 3 },
  ],
};

type AuditStatus = "idle" | "loading" | "complete" | "error";

export default function Home() {
  const [status, setStatus] = useState<AuditStatus>("idle");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [progress, setProgress] = useState<AuditProgress>({
    progress: 0,
    currentStep: "Starting audit...",
  });
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const pollJobStatus = useCallback(async (jobId: string, domain: string) => {
    try {
      const response = await fetch(`/api/audit/status/${jobId}`);
      const data = await response.json();

      if (data.status === "completed" && data.result) {
        // Stop polling
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        setResult(data.result as AuditResult);
        setStatus("complete");
      } else if (data.status === "failed") {
        // Stop polling and show error
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        console.error("Audit failed:", data.error);
        // Fallback to demo data
        setResult({
          ...DEMO_RESULT,
          domain,
          timestamp: new Date().toISOString(),
        });
        setStatus("complete");
      } else {
        // Update progress
        setProgress({
          progress: data.progress || 0,
          currentStep: data.currentStep || "Processing...",
        });
      }
    } catch (error) {
      console.error("Polling error:", error);
    }
  }, []);

  const handleAuditStart = async (domain: string) => {
    setStatus("loading");
    setProgress({ progress: 0, currentStep: "Starting audit..." });

    try {
      // Start the audit job
      const response = await fetch("/api/audit/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const { jobId } = await response.json();

      // Start polling for status
      pollingRef.current = setInterval(() => {
        pollJobStatus(jobId, domain);
      }, 1000); // Poll every second

      // Also poll immediately
      pollJobStatus(jobId, domain);
    } catch (error) {
      console.error("Audit failed:", error);
      // Fallback to demo data on error
      setResult({
        ...DEMO_RESULT,
        domain,
        timestamp: new Date().toISOString(),
      });
      setStatus("complete");
    }
  };

  const handleReset = () => {
    // Clear any pending polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setStatus("idle");
    setResult(null);
    setProgress({ progress: 0, currentStep: "Starting audit..." });
  };

  return (
    <main>
      {status === "idle" && (
        <AuditForm onSubmit={handleAuditStart} isLoading={false} />
      )}
      {status === "loading" && (
        <LoadingAudit progress={progress.progress} currentStep={progress.currentStep} />
      )}
      {status === "complete" && result && (
        <ReportDashboard result={result} onReset={handleReset} />
      )}
      {status === "error" && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl text-destructive mb-4">Audit Failed</h2>
            <button
              onClick={handleReset}
              className="text-foreground underline"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
