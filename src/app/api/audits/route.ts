import { NextRequest, NextResponse } from "next/server";
import {
  listRecentAudits,
  listAuditsForDomain,
  listAuditsAdvanced,
  deleteAudits,
  exportAudits,
  type AuditListParams,
} from "@/lib/audit-storage";

// GET /api/audits - List audits with optional advanced params
// Simple mode: GET /api/audits?domain=example.com&limit=20
// Advanced mode: GET /api/audits?sort=score&order=desc&status=completed&page=1&limit=25
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Check if using advanced mode (any advanced param present)
  const hasAdvancedParams =
    searchParams.has("sort") ||
    searchParams.has("status") ||
    searchParams.has("score_min") ||
    searchParams.has("score_max") ||
    searchParams.has("batch_id") ||
    searchParams.has("search") ||
    searchParams.has("page");

  try {
    if (hasAdvancedParams) {
      // Advanced listing with full filtering and pagination
      const params: AuditListParams = {
        sort: (searchParams.get("sort") as AuditListParams["sort"]) || "created_at",
        order: (searchParams.get("order") as "asc" | "desc") || "desc",
        status: searchParams.get("status") as AuditListParams["status"],
        scoreMin: searchParams.get("score_min")
          ? parseInt(searchParams.get("score_min")!, 10)
          : undefined,
        scoreMax: searchParams.get("score_max")
          ? parseInt(searchParams.get("score_max")!, 10)
          : undefined,
        batchId: searchParams.get("batch_id") || undefined,
        search: searchParams.get("search") || undefined,
        page: parseInt(searchParams.get("page") || "1", 10),
        limit: parseInt(searchParams.get("limit") || "25", 10),
      };

      const result = await listAuditsAdvanced(params);

      return NextResponse.json(result);
    }

    // Simple mode (backwards compatible)
    const domain = searchParams.get("domain");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    const audits = domain
      ? await listAuditsForDomain(domain, limit)
      : await listRecentAudits(limit);

    return NextResponse.json({
      audits: audits.map((a) => ({
        id: a.id,
        domain: a.domain,
        createdAt: a.createdAt,
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

// DELETE /api/audits - Bulk delete audits
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { auditIds } = body as { auditIds: string[] };

    if (!auditIds || !Array.isArray(auditIds) || auditIds.length === 0) {
      return NextResponse.json(
        { error: "auditIds array required" },
        { status: 400 }
      );
    }

    const deleted = await deleteAudits(auditIds);

    return NextResponse.json({ deleted });
  } catch (error) {
    console.error("Failed to delete audits:", error);
    return NextResponse.json(
      { error: "Failed to delete audits" },
      { status: 500 }
    );
  }
}
