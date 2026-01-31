import { NextRequest, NextResponse } from "next/server";
import { loadAudit, saveAudit } from "@/lib/audit-storage";
import type { AuditResult } from "@/types/audit";

// POST /api/audit/recalculate - Recalculate scores from existing data
export async function POST(request: NextRequest) {
  try {
    const { auditId } = await request.json();

    if (!auditId) {
      return NextResponse.json({ error: "Audit ID required" }, { status: 400 });
    }

    const audit = await loadAudit(auditId);
    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    const result = audit.result as AuditResult;

    // Recalculate scores using existing analysis data
    const recalculatedScores = recalculateScores(result);

    // Update the result with new scores
    const updatedResult: AuditResult = {
      ...result,
      overallScore: recalculatedScores.overall,
      projectedScore: Math.min(95, recalculatedScores.overall + 25),
      categories: recalculatedScores.categories,
      // Regenerate recommendations based on new scores
      recommendations: regenerateRecommendations(result, recalculatedScores),
      meta: {
        ...result.meta,
        recalculatedAt: new Date().toISOString(),
      } as AuditResult["meta"],
    };

    // Save the updated audit
    const newAuditId = await saveAudit(audit.domain, {
      ...updatedResult,
      auditId: undefined, // Will get a new ID
    });

    return NextResponse.json({
      success: true,
      oldAuditId: auditId,
      newAuditId,
      oldScore: result.overallScore,
      newScore: updatedResult.overallScore,
      changes: {
        categories: result.categories.map((cat, idx) => ({
          name: cat.name,
          oldScore: cat.score,
          newScore: recalculatedScores.categories[idx].score,
          diff: recalculatedScores.categories[idx].score - cat.score,
        })),
      },
    });
  } catch (error) {
    console.error("Recalculate error:", error);
    return NextResponse.json(
      { error: "Failed to recalculate" },
      { status: 500 }
    );
  }
}

function recalculateScores(result: AuditResult) {
  const bookingFlow = result.bookingFlow;
  const trustSignals = result.trustSignals;

  // Conversion score
  let conversionScore = 50; // Base score
  if (bookingFlow) {
    const bookingEaseScore = 100 - bookingFlow.frictionScore;
    const conversionFactors = [
      bookingFlow.hasBookingCTA,
      bookingFlow.ctaLocation === "above-fold",
      bookingFlow.bookingEngine !== null,
      bookingFlow.hasDatePicker,
      bookingFlow.hasInstantBook,
      bookingFlow.estimatedClicksToBook <= 3,
    ];
    const conversionCheckScore = calculateCategoryScore(conversionFactors);
    conversionScore = Math.round((conversionCheckScore + bookingEaseScore) / 2);
  }

  // Trust score
  const trustScore = trustSignals?.overallTrustScore ?? 50;

  // Performance score - use existing if available
  const existingPerf = result.categories.find((c) => c.name === "Performance");
  const performanceScore = existingPerf?.score ?? 50;

  // Content score
  const existingContent = result.categories.find((c) => c.name === "Content");
  const contentScore = existingContent?.score ?? 50;

  // SEO score
  const existingSeo = result.categories.find((c) => c.name === "SEO");
  const seoScore = existingSeo?.score ?? 50;

  // Security score
  const existingSecurity = result.categories.find((c) => c.name === "Security");
  const securityScore = existingSecurity?.score ?? 100;

  // Calculate overall
  const overall = Math.round(
    conversionScore * 0.35 +
      performanceScore * 0.2 +
      trustScore * 0.2 +
      contentScore * 0.15 +
      seoScore * 0.07 +
      securityScore * 0.03
  );

  return {
    overall,
    categories: [
      {
        name: "Conversion",
        score: conversionScore,
        weight: 35,
        description: "Booking flow and calls-to-action",
        source: bookingFlow?.bookingEngine
          ? `Detected: ${bookingFlow.bookingEngine.name}`
          : "HTML analysis",
      },
      {
        name: "Performance",
        score: performanceScore,
        weight: 20,
        description: "Page speed and mobile experience",
        source: existingPerf?.source || "HTML analysis",
      },
      {
        name: "Trust",
        score: trustScore,
        weight: 20,
        description: "Reviews, ratings, and credibility",
        source: trustSignals?.reviewSource
          ? `Reviews: ${trustSignals.reviewSource.name}`
          : "HTML analysis",
      },
      {
        name: "Content",
        score: contentScore,
        weight: 15,
        description: "Images and property descriptions",
      },
      {
        name: "SEO",
        score: seoScore,
        weight: 7,
        description: "Search engine optimization",
        source: existingSeo?.source || "HTML analysis",
      },
      {
        name: "Security",
        score: securityScore,
        weight: 3,
        description: "SSL and data protection",
      },
    ],
  };
}

function calculateCategoryScore(checks: boolean[]): number {
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

function regenerateRecommendations(
  result: AuditResult,
  _scores: ReturnType<typeof recalculateScores>
): AuditResult["recommendations"] {
  // For now, keep existing recommendations
  // In the future, we could regenerate them based on new thresholds
  return result.recommendations;
}
