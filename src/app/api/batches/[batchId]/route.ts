import { NextRequest, NextResponse } from "next/server";
import { getBatch, getAuditsForBatch, deleteBatch, updateBatch } from "@/lib/batch-storage";

/**
 * GET /api/batches/[batchId]
 * Get batch status with audit progress
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await params;

    const batch = await getBatch(batchId);
    if (!batch) {
      return NextResponse.json(
        { error: "Batch not found" },
        { status: 404 }
      );
    }

    // Get audits for this batch
    const audits = await getAuditsForBatch(batchId);

    // Calculate progress stats
    const progress = {
      total: batch.totalDomains,
      completed: batch.completedCount,
      failed: batch.failedCount,
      pending: batch.totalDomains - batch.completedCount - batch.failedCount,
      percentComplete: Math.round(
        ((batch.completedCount + batch.failedCount) / batch.totalDomains) * 100
      ),
    };

    return NextResponse.json({
      batch,
      progress,
      audits,
    });
  } catch (error) {
    console.error("[Batch API] Failed to get batch:", error);
    return NextResponse.json(
      { error: "Failed to get batch" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/batches/[batchId]
 * Update batch (e.g., cancel it)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await params;
    const body = await request.json();

    const batch = await getBatch(batchId);
    if (!batch) {
      return NextResponse.json(
        { error: "Batch not found" },
        { status: 404 }
      );
    }

    // Only allow certain updates
    const allowedUpdates: Record<string, unknown> = {};
    if (body.name !== undefined) {
      allowedUpdates.name = body.name;
    }
    if (body.status === "cancelled" && batch.status === "processing") {
      allowedUpdates.status = "cancelled";
    }

    const updatedBatch = await updateBatch(batchId, allowedUpdates);

    return NextResponse.json({ batch: updatedBatch });
  } catch (error) {
    console.error("[Batch API] Failed to update batch:", error);
    return NextResponse.json(
      { error: "Failed to update batch" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/batches/[batchId]
 * Delete a batch
 *
 * Query params:
 * - deleteAudits: boolean - Whether to also delete associated audits
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await params;
    const { searchParams } = new URL(request.url);
    const deleteAudits = searchParams.get("deleteAudits") === "true";

    const batch = await getBatch(batchId);
    if (!batch) {
      return NextResponse.json(
        { error: "Batch not found" },
        { status: 404 }
      );
    }

    // Don't allow deleting processing batches
    if (batch.status === "processing") {
      return NextResponse.json(
        { error: "Cannot delete a batch that is still processing" },
        { status: 400 }
      );
    }

    const deleted = await deleteBatch(batchId, deleteAudits);

    return NextResponse.json({ deleted, batchId });
  } catch (error) {
    console.error("[Batch API] Failed to delete batch:", error);
    return NextResponse.json(
      { error: "Failed to delete batch" },
      { status: 500 }
    );
  }
}
