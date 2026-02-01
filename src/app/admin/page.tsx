"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Clock,
  Loader2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemePicker } from "@/components/theme-picker";

interface AuditSummary {
  id: string;
  domain: string;
  createdAt: string;
  overallScore?: number;
}

interface RunningJob {
  jobId: string;
  domain: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  currentStep: string;
}

interface ApiBalances {
  semrush: { units: number | null; error?: string };
  dataForSEO: { balance: number | null; spent: number | null; error?: string };
  fetchedAt: string;
}

export default function AdminPage() {
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [runningJobs, setRunningJobs] = useState<Map<string, RunningJob>>(new Map());
  const [newDomain, setNewDomain] = useState("");
  const [bulkDomains, setBulkDomains] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [balances, setBalances] = useState<ApiBalances | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  // Fetch API balances
  const fetchBalances = useCallback(async () => {
    try {
      const res = await fetch("/api/balances");
      const data = await res.json();
      setBalances(data);
    } catch (error) {
      console.error("Failed to fetch balances:", error);
    }
  }, []);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Fetch existing audits
  const fetchAudits = useCallback(async () => {
    try {
      const res = await fetch("/api/audits?limit=50");
      const data = await res.json();
      setAudits(data.audits || []);
    } catch (error) {
      console.error("Failed to fetch audits:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  // Poll running jobs
  useEffect(() => {
    if (runningJobs.size === 0) return;

    const interval = setInterval(async () => {
      const updates = new Map(runningJobs);
      let hasChanges = false;

      for (const [jobId, job] of runningJobs) {
        if (job.status === "completed" || job.status === "failed") continue;

        try {
          const res = await fetch(`/api/audit/status/${jobId}`);
          const data = await res.json();

          if (data.status === "completed") {
            updates.delete(jobId);
            hasChanges = true;
            // Refresh the audits list
            fetchAudits();
          } else if (data.status === "failed") {
            updates.set(jobId, { ...job, status: "failed" });
            hasChanges = true;
          } else {
            updates.set(jobId, {
              ...job,
              status: data.status,
              progress: data.progress || 0,
              currentStep: data.currentStep || "",
            });
            hasChanges = true;
          }
        } catch {
          // Job might have completed and been removed
          updates.delete(jobId);
          hasChanges = true;
        }
      }

      if (hasChanges) {
        setRunningJobs(updates);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [runningJobs, fetchAudits]);

  // Start a new audit
  const startAudit = async (domain: string) => {
    if (!domain.trim()) return;

    try {
      const res = await fetch("/api/audit/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      const data = await res.json();

      if (data.jobId) {
        setRunningJobs((prev) => {
          const next = new Map(prev);
          next.set(data.jobId, {
            jobId: data.jobId,
            domain: domain.trim(),
            status: "pending",
            progress: 0,
            currentStep: "Starting...",
          });
          return next;
        });
        setNewDomain("");
      }
    } catch (error) {
      console.error("Failed to start audit:", error);
    }
  };

  // Start bulk audits
  const startBulkAudits = async () => {
    const domains = bulkDomains
      .split(/[\n,]+/)
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    if (domains.length === 0) return;

    for (const domain of domains) {
      await startAudit(domain);
      // Small delay to avoid overwhelming the server
      await new Promise((r) => setTimeout(r, 500));
    }
    setBulkDomains("");
    setShowBulk(false);
  };

  const copyUrl = async (auditId: string) => {
    const url = `${baseUrl}/report/${auditId}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(auditId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getScoreColor = (score?: number) => {
    if (!score) return "secondary";
    if (score >= 70) return "success";
    if (score >= 50) return "warning";
    return "error";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Audit Admin</h1>
            <Badge variant="outline">{audits.length} audits</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchAudits}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <ThemePicker />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* API Balances */}
        <div className="mb-6 flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
          <Wallet className="size-5 text-muted-foreground" />
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">SEMrush:</span>
              {balances?.semrush?.units != null ? (
                <span className="font-mono font-medium">
                  {balances.semrush.units.toLocaleString()} units
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">DataForSEO:</span>
              {balances?.dataForSEO?.balance != null ? (
                <span className="font-mono font-medium">
                  ${balances.dataForSEO.balance.toFixed(2)}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
              {balances?.dataForSEO?.spent != null && (
                <span className="text-xs text-muted-foreground">
                  (${balances.dataForSEO.spent.toFixed(2)} spent)
                </span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7"
            onClick={fetchBalances}
          >
            <RefreshCw className="size-3" />
          </Button>
        </div>

        {/* New Audit Form */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Generate New Audit</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBulk(!showBulk)}
              >
                {showBulk ? "Single" : "Bulk"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showBulk ? (
              <div className="space-y-3">
                <textarea
                  placeholder="Paste domains (one per line or comma-separated)"
                  value={bulkDomains}
                  onChange={(e) => setBulkDomains(e.target.value)}
                  className="w-full h-32 p-3 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {bulkDomains
                      .split(/[\n,]+/)
                      .filter((d) => d.trim()).length}{" "}
                    domains
                  </span>
                  <Button onClick={startBulkAudits} disabled={!bulkDomains.trim()}>
                    <Plus className="size-4" />
                    Start All Audits
                  </Button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  startAudit(newDomain);
                }}
                className="flex gap-3"
              >
                <Input
                  placeholder="Enter domain (e.g., example.com)"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={!newDomain.trim()}>
                  <Plus className="size-4" />
                  Start Audit
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Running Jobs */}
        {runningJobs.size > 0 && (
          <Card className="mb-8 border-primary/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Running Audits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from(runningJobs.values()).map((job) => (
                  <div
                    key={job.jobId}
                    className="flex items-center gap-4 p-3 rounded-lg border border-border bg-muted/30"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{job.domain}</div>
                      <div className="text-sm text-muted-foreground">
                        {job.currentStep}
                      </div>
                    </div>
                    <div className="w-32">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground text-center mt-1">
                        {job.progress}%
                      </div>
                    </div>
                    {job.status === "failed" && (
                      <Badge variant="error">Failed</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Audits List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Generated Audits</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : audits.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No audits yet. Generate one above.
              </div>
            ) : (
              <div className="space-y-2">
                {audits.map((audit) => (
                  <div
                    key={audit.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    {/* Score */}
                    <div className="w-16 text-center">
                      {audit.overallScore !== undefined ? (
                        <Badge
                          variant={getScoreColor(audit.overallScore) as "success" | "warning" | "error" | "secondary"}
                          className="text-lg px-3 py-1"
                        >
                          {audit.overallScore}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">--</Badge>
                      )}
                    </div>

                    {/* Domain & Date */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{audit.domain}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatDate(audit.createdAt)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startAudit(audit.domain)}
                        title="Re-run audit"
                      >
                        <RefreshCw className="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyUrl(audit.id)}
                      >
                        {copiedId === audit.id ? (
                          <>
                            <Check className="size-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="size-4" />
                            Copy URL
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          window.location.href = `/admin/${audit.id}`
                        }
                        title="View raw data"
                      >
                        Data
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          window.open(`/report/${audit.id}`, "_blank")
                        }
                      >
                        <ExternalLink className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Total Audits</div>
            <div className="text-2xl font-bold">{audits.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Running</div>
            <div className="text-2xl font-bold">{runningJobs.size}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Avg Score</div>
            <div className="text-2xl font-bold">
              {audits.length > 0
                ? Math.round(
                    audits
                      .filter((a) => a.overallScore !== undefined)
                      .reduce((sum, a) => sum + (a.overallScore || 0), 0) /
                      audits.filter((a) => a.overallScore !== undefined).length
                  ) || "--"
                : "--"}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
