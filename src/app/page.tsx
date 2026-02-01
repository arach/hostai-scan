"use client";

import { useState, useCallback, useRef } from "react";
import { Header, HeroSection, FeaturesSection, PartnersSection, Footer } from "@/components/landing";
import { MultiPhaseScanner, useScannerProgress, DEFAULT_PHASES } from "@/components/scanner";
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
    { name: "Conversion", score: 55, weight: 35, description: "Booking flow and user experience" },
    { name: "Performance", score: 72, weight: 20, description: "Page load speed and core web vitals" },
    { name: "Trust Signals", score: 48, weight: 20, description: "Reviews, certifications, and credibility" },
    { name: "Content", score: 68, weight: 15, description: "Property descriptions and media quality" },
    { name: "SEO", score: 75, weight: 7, description: "Search engine visibility" },
    { name: "Security", score: 90, weight: 3, description: "SSL and data protection" },
  ],
  recommendations: [
    { title: "Add prominent booking CTA above the fold", description: "Visitors shouldn't have to scroll to find how to book.", status: "fail", impact: "High", category: "Conversion" },
    { title: "Display pricing upfront", description: "Show nightly rates on property cards to set expectations early.", status: "fail", impact: "High", category: "Conversion" },
    { title: "Reduce steps to checkout", description: "Currently 5 clicks to payment. Best-in-class is 3.", status: "warning", impact: "High", category: "Conversion" },
    { title: "Add guest reviews section", description: "No visible reviews. Social proof is critical for bookings.", status: "fail", impact: "High", category: "Trust Signals" },
    { title: "SSL certificate valid", description: "Your site uses HTTPS correctly.", status: "pass", impact: "High", category: "Security" },
    { title: "Mobile responsive design", description: "Site adapts well to mobile viewports.", status: "pass", impact: "High", category: "Performance" },
    { title: "Optimize hero image", description: "Main image is 2.4MB. Compress to under 200KB.", status: "fail", impact: "Medium", category: "Performance" },
    { title: "Add structured data for vacation rentals", description: "Rich snippets can improve search click-through rates.", status: "warning", impact: "Medium", category: "SEO" },
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
  const [domain, setDomain] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [pendingResult, setPendingResult] = useState<AuditResult | null>(null); // Holds result until animation completes
  const [progress, setProgress] = useState<AuditProgress>({
    progress: 0,
    currentStep: "Starting audit...",
  });
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Scanner progress hook for the loading animation
  // Runs at a steady, comfortable pace independent of actual API timing
  // Equal time per phase: 10 seconds × 5 phases = 50 seconds
  const scannerProgress = useScannerProgress({
    phases: DEFAULT_PHASES,
    totalDuration: 50000,
    autoStart: false,
    onComplete: () => {
      // Animation finished - show result if we have one
      if (pendingResult) {
        setResult(pendingResult);
        setPendingResult(null);
        setStatus("complete");
      }
    },
  });

  // When API completes but animation still running, wait for animation
  useEffect(() => {
    if (pendingResult && scannerProgress.progress.isComplete) {
      setResult(pendingResult);
      setPendingResult(null);
      setStatus("complete");
    }
  }, [pendingResult, scannerProgress.progress.isComplete]);

  const pollJobStatus = useCallback(async (jobId: string, auditDomain: string) => {
    try {
      const response = await fetch(`/api/audit/status/${jobId}`);
      const data = await response.json();

      if (data.status === "completed" && data.result) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        // Store result but wait for animation to complete
        setPendingResult(data.result as AuditResult);
      } else if (data.status === "failed") {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        console.error("Audit failed:", data.error);
        // Store fallback result but wait for animation
        setPendingResult({ ...DEMO_RESULT, domain: auditDomain, timestamp: new Date().toISOString() });
      } else {
        setProgress({
          progress: data.progress || 0,
          currentStep: data.currentStep || "Processing...",
        });
      }
    } catch (err) {
      console.error("Polling error:", err);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!domain.trim()) {
      setError("Please enter a domain");
      return;
    }

    setError("");
    setStatus("loading");
    setProgress({ progress: 0, currentStep: "Starting audit..." });
    scannerProgress.start();

    try {
      const response = await fetch("/api/audit/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim() }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const { jobId } = await response.json();

      pollingRef.current = setInterval(() => {
        pollJobStatus(jobId, domain.trim());
      }, 1000);

      pollJobStatus(jobId, domain.trim());
    } catch (err) {
      console.error("Audit failed:", err);
      // Store fallback result but wait for animation
      setPendingResult({ ...DEMO_RESULT, domain: domain.trim(), timestamp: new Date().toISOString() });
    }
  };

  const handleReset = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    scannerProgress.reset();
    setStatus("idle");
    setResult(null);
    setPendingResult(null);
    setDomain("");
    setError("");
    setProgress({ progress: 0, currentStep: "Starting audit..." });
  };

  // Idle state - Landing page
  if (status === "idle") {
    return (
      <main className="min-h-screen" style={{ background: "#fff" }}>
        <Header />
        <HeroSection
          domain={domain}
          setDomain={setDomain}
          onSubmit={handleSubmit}
          isLoading={false}
          error={error}
        />
        <PartnersSection />
        <FeaturesSection />
        <Footer />
      </main>
    );
  }

  // Loading state - Multi-phase scanner
  if (status === "loading") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-normal mb-2 text-foreground tracking-tight">
            Analyzing {domain}
          </h2>
          <p className="text-muted-foreground">
            {progress.currentStep || scannerProgress.progress.statusMessage}
          </p>
        </div>

        <MultiPhaseScanner
          currentPhase={scannerProgress.progress.currentPhase}
          phaseProgress={scannerProgress.progress.phaseProgress}
          overallProgress={scannerProgress.progress.overallProgress}
        />

        <button
          onClick={handleReset}
          className="mt-8 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancel
        </button>
      </main>
    );
  }

  // Complete state - Report dashboard (dark theme)
  if (status === "complete" && result) {
    return (
      <div className="dark">
        <ReportDashboard result={result} onReset={handleReset} />
      </div>
    );
  }

  // Error state
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h2 className="text-2xl mb-4 text-error">
          Audit Failed
        </h2>
        <button
          onClick={handleReset}
          className="underline text-foreground hover:text-muted-foreground transition-colors"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
