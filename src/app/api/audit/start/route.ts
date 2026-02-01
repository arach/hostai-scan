import { NextRequest, NextResponse } from "next/server";
import { createJob, updateJob } from "@/lib/audit-queue";
import { saveAudit } from "@/lib/audit-storage";
import { runAudit } from "../runner";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain } = body;

    if (!domain) {
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 }
      );
    }

    // Clean the domain
    const cleanDomain = domain
      .replace(/^(https?:\/\/)?(www\.)?/, "")
      .split("/")[0];

    // Create job
    const job = await createJob(cleanDomain);

    // Start audit in background (don't await)
    runAuditInBackground(job.id, cleanDomain);

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      message: "Audit started",
    });
  } catch (error) {
    console.error("Failed to start audit:", error);
    return NextResponse.json(
      { error: "Failed to start audit" },
      { status: 500 }
    );
  }
}

async function runAuditInBackground(jobId: string, domain: string) {
  const url = `https://${domain}`;

  try {
    // Update to running
    await updateJob(jobId, {
      status: "running",
      progress: 10,
      currentStep: "Fetching website...",
    });

    // Run the actual audit
    const result = await runAudit(url, domain, async (progress, step) => {
      await updateJob(jobId, { progress, currentStep: step });
    });

    // Save to JSON file for persistence
    const auditId = await saveAudit(domain, result);
    console.log(`Audit saved with ID: ${auditId}`);

    // Mark as completed with the persisted audit ID
    await updateJob(jobId, {
      status: "completed",
      progress: 100,
      currentStep: "Complete",
      result: { ...result, auditId },
      completedAt: new Date(),
    });
  } catch (error) {
    console.error("Audit failed:", error);
    await updateJob(jobId, {
      status: "failed",
      error: String(error),
      currentStep: "Failed",
    });
  }
}
