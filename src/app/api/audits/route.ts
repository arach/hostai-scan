import { NextRequest, NextResponse } from "next/server";
import { listRecentAudits, listAuditsForDomain } from "@/lib/audit-storage";

// GET /api/audits - List recent audits
// GET /api/audits?domain=example.com - List audits for a domain
export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain");
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 20;

  try {
    const audits = domain
      ? await listAuditsForDomain(domain, limit)
      : await listRecentAudits(limit);

    return NextResponse.json({
      audits: audits.map((a) => ({
        id: a.id,
        domain: a.domain,
        createdAt: a.createdAt,
        // Include summary score from result if available
        overallScore: (a.result as { overallScore?: number })?.overallScore,
      })),
      total: audits.length,
    });
  } catch (error) {
    console.error("Failed to list audits:", error);
    return NextResponse.json(
      { error: "Failed to list audits" },
      { status: 500 }
    );
  }
}
