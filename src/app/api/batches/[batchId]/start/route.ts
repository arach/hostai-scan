import { NextRequest, NextResponse } from "next/server";
import { getBatch, updateBatch, incrementBatchCount, checkAndCompleteBatch } from "@/lib/batch-storage";
import { createJob, updateJob } from "@/lib/audit-queue";
import { saveAudit } from "@/lib/audit-storage";
import { db } from "@/lib/db";

// Import the audit runner
import { runAudit } from "@/app/api/audit/runner";

// Maximum concurrent audits
const MAX_CONCURRENT = 3;

// Track active batch processing
const activeBatches = new Set<string>();

/**
 * POST /api/batches/[batchId]/start
 * Start processing a batch
 *
 * Body:
 * - domains: string[] - Array of domains to process (in order)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await params;
    const body = await request.json();
    const { domains } = body;

    if (!Array.isArray(domains) || domains.length === 0) {
      return NextResponse.json(
        { error: "domains array is required" },
        { status: 400 }
      );
    }

    const batch = await getBatch(batchId);
    if (!batch) {
      return NextResponse.json(
        { error: "Batch not found" },
        { status: 404 }
      );
    }

    if (batch.status !== "pending") {
      return NextResponse.json(
        { error: `Batch is already ${batch.status}` },
        { status: 400 }
      );
    }

    // Prevent duplicate processing
    if (activeBatches.has(batchId)) {
      return NextResponse.json(
        { error: "Batch is already being processed" },
        { status: 400 }
      );
    }

    // Mark batch as processing
    await updateBatch(batchId, { status: "processing" });
    activeBatches.add(batchId);

    // Start processing in background
    processBatchInBackground(batchId, domains).finally(() => {
      activeBatches.delete(batchId);
    });

    console.log(`[Batch Start] Started processing batch ${batchId} with ${domains.length} domains`);

    return NextResponse.json({
      message: "Batch processing started",
      batchId,
      totalDomains: domains.length,
    });
  } catch (error) {
    console.error("[Batch Start] Failed to start batch:", error);
    return NextResponse.json(
      { error: "Failed to start batch" },
      { status: 500 }
    );
  }
}

/**
 * Process batch domains with concurrency control
 */
async function processBatchInBackground(batchId: string, domains: string[]) {
  console.log(`[Batch Processor] Processing ${domains.length} domains for batch ${batchId}`);

  // Process domains in chunks with concurrency limit
  const queue = [...domains];
  const activePromises: Promise<void>[] = [];

  let position = 0;

  while (queue.length > 0 || activePromises.length > 0) {
    // Check if batch was cancelled
    const batch = await getBatch(batchId);
    if (batch?.status === "cancelled") {
      console.log(`[Batch Processor] Batch ${batchId} was cancelled, stopping`);
      break;
    }

    // Start new audits up to MAX_CONCURRENT
    while (queue.length > 0 && activePromises.length < MAX_CONCURRENT) {
      const domain = queue.shift()!;
      const currentPosition = position++;

      const promise = processOneDomain(batchId, domain, currentPosition)
        .catch((error) => {
          console.error(`[Batch Processor] Error processing ${domain}:`, error);
        });

      activePromises.push(promise);
    }

    // Wait for at least one to complete before starting more
    if (activePromises.length > 0) {
      await Promise.race(activePromises);
      // Remove completed promises
      const stillActive: Promise<void>[] = [];
      for (const p of activePromises) {
        // Check if promise is resolved by racing with an immediate resolve
        const status = await Promise.race([
          p.then(() => "resolved").catch(() => "rejected"),
          Promise.resolve("pending"),
        ]);
        if (status === "pending") {
          stillActive.push(p);
        }
      }
      // Clear and repopulate
      activePromises.length = 0;
      activePromises.push(...stillActive);
    }

    // Small delay to prevent tight loop
    await new Promise((r) => setTimeout(r, 100));
  }

  // Wait for remaining audits to complete
  await Promise.all(activePromises);

  // Mark batch as completed
  await checkAndCompleteBatch(batchId);

  console.log(`[Batch Processor] Batch ${batchId} processing completed`);
}

/**
 * Process a single domain
 */
async function processOneDomain(
  batchId: string,
  domain: string,
  position: number
): Promise<void> {
  const url = `https://${domain}`;

  try {
    console.log(`[Batch Processor] Starting audit for ${domain} (position ${position})`);

    // Create job
    const job = await createJob(domain);

    // Update job to running
    await updateJob(job.id, {
      status: "running",
      progress: 10,
      currentStep: "Fetching website...",
    });

    // Run the audit
    const result = await runAudit(url, domain, async (progress, step) => {
      await updateJob(job.id, { progress, currentStep: step });
    });

    // Save audit with batch info
    const auditId = await saveAuditWithBatch(domain, result, batchId, position);

    console.log(`[Batch Processor] Audit saved with ID: ${auditId}`);

    // Mark job as completed
    await updateJob(job.id, {
      status: "completed",
      progress: 100,
      currentStep: "Complete",
      result: { ...result, auditId },
      completedAt: new Date(),
    });

    // Increment completed count
    await incrementBatchCount(batchId, "completed");
  } catch (error) {
    console.error(`[Batch Processor] Audit failed for ${domain}:`, error);

    // Still create an audit record to track the failure
    await saveAuditWithBatch(
      domain,
      { error: String(error) },
      batchId,
      position,
      "failed"
    );

    // Increment failed count
    await incrementBatchCount(batchId, "failed");
  }
}

/**
 * Save audit with batch association
 */
async function saveAuditWithBatch(
  domain: string,
  result: unknown,
  batchId: string,
  position: number,
  status: string = "completed"
): Promise<string> {
  const id = generateAuditId(domain);
  const now = new Date().toISOString();
  const resultJson = JSON.stringify(result);

  // Extract score if available
  let score: number | null = null;
  if (typeof result === "object" && result !== null && "overallScore" in result) {
    score = (result as { overallScore?: number }).overallScore || null;
  }

  await db.execute({
    sql: `INSERT INTO audits (id, domain, status, created_at, completed_at, result, score, batch_id, batch_position)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, domain, status, now, now, resultJson, score, batchId, position],
  });

  return id;
}

/**
 * Generate audit ID (same pattern as audit-storage.ts)
 */
function generateAuditId(domain: string): string {
  const slug = domain.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const timestamp = Date.now();
  return `${slug}-${timestamp}`;
}
