// Simple in-memory job queue for audit jobs
// In production, this would be Redis or a database

export interface AuditJob {
  id: string;
  domain: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number; // 0-100
  currentStep: string;
  result: unknown | null;
  error: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

// In-memory store (resets on server restart)
const jobs = new Map<string, AuditJob>();

export function createJob(domain: string): AuditJob {
  const id = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const job: AuditJob = {
    id,
    domain,
    status: "pending",
    progress: 0,
    currentStep: "Initializing...",
    result: null,
    error: null,
    createdAt: new Date(),
    completedAt: null,
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): AuditJob | null {
  return jobs.get(id) || null;
}

export function updateJob(id: string, updates: Partial<AuditJob>): AuditJob | null {
  const job = jobs.get(id);
  if (!job) return null;

  const updated = { ...job, ...updates };
  jobs.set(id, updated);
  return updated;
}

// Clean up old jobs (older than 1 hour)
export function cleanupOldJobs(): void {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [id, job] of jobs.entries()) {
    if (job.createdAt.getTime() < oneHourAgo) {
      jobs.delete(id);
    }
  }
}

// Run cleanup every 10 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupOldJobs, 10 * 60 * 1000);
}
