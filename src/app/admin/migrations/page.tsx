"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Database,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Play,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Migration {
  name: string;
  appliedAt: string | null;
  status: "applied" | "pending" | "error";
  error?: string;
}

interface MigrationsData {
  migrations: Migration[];
  summary: {
    total: number;
    applied: number;
    pending: number;
  };
}

interface RunResult {
  success: boolean;
  applied: string[];
  skipped: string[];
  errors: { name: string; error: string }[];
}

export default function MigrationsPage() {
  const [data, setData] = useState<MigrationsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMigrations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/migrations");
      if (!res.ok) throw new Error("Failed to fetch migrations");
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const runMigrations = async () => {
    setIsRunning(true);
    setRunResult(null);
    try {
      const res = await fetch("/api/admin/migrations", { method: "POST" });
      const result = await res.json();
      setRunResult(result);
      // Refresh the list
      await fetchMigrations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run migrations");
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    fetchMigrations();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: Migration["status"]) => {
    switch (status) {
      case "applied":
        return <CheckCircle2 className="size-4 text-green-500" />;
      case "pending":
        return <Clock className="size-4 text-yellow-500" />;
      case "error":
        return <AlertCircle className="size-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: Migration["status"]) => {
    switch (status) {
      case "applied":
        return <Badge variant="success">Applied</Badge>;
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      case "error":
        return <Badge variant="error">Error</Badge>;
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 shrink-0 border-b border-border bg-background/95 backdrop-blur z-40">
        <div className="px-4 sm:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = "/admin")}
              className="gap-1.5"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Database className="size-4 text-muted-foreground" />
              <h1 className="font-semibold">Migrations</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground mr-2">
                <span>{data.summary.applied} applied</span>
                {data.summary.pending > 0 && (
                  <>
                    <span className="text-border">|</span>
                    <span className="text-yellow-500">{data.summary.pending} pending</span>
                  </>
                )}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMigrations}
              disabled={isLoading}
            >
              <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
            </Button>
            {data && data.summary.pending > 0 && (
              <Button
                size="sm"
                onClick={runMigrations}
                disabled={isRunning}
              >
                {isRunning ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Play className="size-4" />
                )}
                Run Migrations
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Run Result Banner */}
          {runResult && (
            <div
              className={cn(
                "mb-6 p-4 rounded-lg border",
                runResult.errors.length > 0
                  ? "bg-red-500/10 border-red-500/30"
                  : "bg-green-500/10 border-green-500/30"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                {runResult.errors.length > 0 ? (
                  <AlertCircle className="size-5 text-red-500" />
                ) : (
                  <CheckCircle2 className="size-5 text-green-500" />
                )}
                <span className="font-medium">
                  {runResult.errors.length > 0
                    ? "Migrations completed with errors"
                    : "Migrations completed successfully"}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {runResult.applied.length > 0 && (
                  <p>Applied: {runResult.applied.join(", ")}</p>
                )}
                {runResult.skipped.length > 0 && (
                  <p>Skipped: {runResult.skipped.join(", ")}</p>
                )}
                {runResult.errors.map((err, i) => (
                  <p key={i} className="text-red-500">
                    Error in {err.name}: {err.error}
                  </p>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setRunResult(null)}
              >
                Dismiss
              </Button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500">
              {error}
            </div>
          )}

          {/* Loading */}
          {isLoading && !data && (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Migrations List */}
          {data && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="p-4 rounded-lg border border-border bg-card">
                  <div className="text-sm text-muted-foreground mb-1">Total</div>
                  <div className="text-2xl font-bold">{data.summary.total}</div>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card">
                  <div className="text-sm text-muted-foreground mb-1">Applied</div>
                  <div className="text-2xl font-bold text-green-500">
                    {data.summary.applied}
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card">
                  <div className="text-sm text-muted-foreground mb-1">Pending</div>
                  <div className={cn(
                    "text-2xl font-bold",
                    data.summary.pending > 0 ? "text-yellow-500" : "text-muted-foreground"
                  )}>
                    {data.summary.pending}
                  </div>
                </div>
              </div>

              {/* Migrations Table */}
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Migration
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Applied At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.migrations.map((migration) => (
                      <tr key={migration.name} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(migration.status)}
                            {getStatusBadge(migration.status)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {migration.name}
                          </code>
                          {migration.error && (
                            <p className="text-xs text-red-500 mt-1">{migration.error}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {migration.appliedAt ? formatDate(migration.appliedAt) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.migrations.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No migrations found
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
