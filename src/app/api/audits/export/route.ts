import { NextRequest, NextResponse } from "next/server";
import { exportAudits, type AuditListParams } from "@/lib/audit-storage";

// GET /api/audits/export - Export audits as CSV
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  try {
    const params: Omit<AuditListParams, "page" | "limit"> = {
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
    };

    const audits = await exportAudits(params);

    // Build CSV
    const headers = [
      "ID",
      "Domain",
      "Score",
      "Status",
      "Views",
      "Created At",
      "Batch ID",
    ];

    const rows = audits.map((audit) => [
      audit.id,
      audit.domain,
      audit.score?.toString() || "",
      audit.status,
      audit.viewCount.toString(),
      audit.createdAt,
      audit.batchId || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // Return as downloadable CSV
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="audits-export-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Failed to export audits:", error);
    return NextResponse.json(
      { error: "Failed to export audits" },
      { status: 500 }
    );
  }
}
