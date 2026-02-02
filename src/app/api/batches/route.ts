import { NextRequest, NextResponse } from "next/server";
import { parseDomains } from "@/lib/domain-parser";
import { createBatch, listBatches } from "@/lib/batch-storage";

/**
 * POST /api/batches
 * Create a new batch from domains array or raw text
 *
 * Body:
 * - domains: string[] - Array of domains (pre-parsed) OR
 * - rawText: string - Raw text to parse
 * - name?: string - Optional batch name
 * - source?: "paste" | "file" | "api" - Source of domains
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domains: providedDomains, rawText, name, source = "paste" } = body;

    let validDomains: string[];
    let invalidDomains: { input: string; reason: string }[] = [];

    // Parse domains from raw text or use provided array
    if (rawText) {
      const parsed = parseDomains(rawText);
      validDomains = parsed.valid;
      invalidDomains = parsed.invalid;
    } else if (Array.isArray(providedDomains)) {
      // Re-parse to normalize and validate
      const parsed = parseDomains(providedDomains.join("\n"));
      validDomains = parsed.valid;
      invalidDomains = parsed.invalid;
    } else {
      return NextResponse.json(
        { error: "Either domains array or rawText is required" },
        { status: 400 }
      );
    }

    if (validDomains.length === 0) {
      return NextResponse.json(
        {
          error: "No valid domains found",
          invalidDomains,
        },
        { status: 400 }
      );
    }

    // Create the batch
    const batch = await createBatch({
      name: name || `Import ${new Date().toLocaleDateString()}`,
      source,
      totalDomains: validDomains.length,
    });

    console.log(`[Batches API] Created batch ${batch.id} with ${validDomains.length} domains`);

    return NextResponse.json({
      batchId: batch.id,
      batch,
      domains: validDomains,
      validCount: validDomains.length,
      invalidCount: invalidDomains.length,
      invalidDomains: invalidDomains.length > 0 ? invalidDomains : undefined,
    });
  } catch (error) {
    console.error("[Batches API] Failed to create batch:", error);
    return NextResponse.json(
      { error: "Failed to create batch" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/batches
 * List all batches with pagination
 *
 * Query params:
 * - limit?: number (default 20)
 * - offset?: number (default 0)
 * - status?: "pending" | "processing" | "completed" | "failed" | "cancelled"
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status") as
      | "pending"
      | "processing"
      | "completed"
      | "failed"
      | "cancelled"
      | null;

    const { batches, total } = await listBatches({
      limit,
      offset,
      status: status || undefined,
    });

    return NextResponse.json({
      batches,
      total,
      limit,
      offset,
      hasMore: offset + batches.length < total,
    });
  } catch (error) {
    console.error("[Batches API] Failed to list batches:", error);
    return NextResponse.json(
      { error: "Failed to list batches" },
      { status: 500 }
    );
  }
}
