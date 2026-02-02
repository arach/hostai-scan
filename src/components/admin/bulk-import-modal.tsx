"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  Upload,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { parseDomains } from "@/lib/domain-parser";
import { cn } from "@/lib/utils";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchStarted?: (batchId: string) => void;
}

interface BatchStatus {
  batchId: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  progress: {
    total: number;
    completed: number;
    failed: number;
    pending: number;
    percentComplete: number;
  };
  audits: Array<{
    auditId: string;
    domain: string;
    position: number;
    status: string;
  }>;
}

export function BulkImportModal({
  isOpen,
  onClose,
  onBatchStarted,
}: BulkImportModalProps) {
  const [rawInput, setRawInput] = useState("");
  const [batchName, setBatchName] = useState("");
  const [step, setStep] = useState<"input" | "preview" | "processing">("input");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeBatch, setActiveBatch] = useState<BatchStatus | null>(null);
  const [validDomains, setValidDomains] = useState<string[]>([]);
  const [invalidDomains, setInvalidDomains] = useState<
    { input: string; reason: string }[]
  >([]);

  // Parse domains whenever input changes
  const parsedResult = useMemo(() => {
    if (!rawInput.trim()) {
      return { valid: [], invalid: [] };
    }
    return parseDomains(rawInput);
  }, [rawInput]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setRawInput("");
      setBatchName("");
      setStep("input");
      setError(null);
      setActiveBatch(null);
      setValidDomains([]);
      setInvalidDomains([]);
    }
  }, [isOpen]);

  // Poll for batch status when processing
  useEffect(() => {
    if (step !== "processing" || !activeBatch) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/batches/${activeBatch.batchId}`);
        if (!res.ok) return;

        const data = await res.json();
        setActiveBatch({
          batchId: data.batch.id,
          status: data.batch.status,
          progress: data.progress,
          audits: data.audits || [],
        });

        // Stop polling when completed or failed
        if (
          data.batch.status === "completed" ||
          data.batch.status === "failed" ||
          data.batch.status === "cancelled"
        ) {
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Failed to poll batch status:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [step, activeBatch?.batchId]);

  const handlePreview = () => {
    setValidDomains(parsedResult.valid);
    setInvalidDomains(parsedResult.invalid);
    setStep("preview");
  };

  const handleStartImport = async () => {
    if (validDomains.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Create batch
      const createRes = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domains: validDomains,
          name: batchName || undefined,
          source: "paste",
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error || "Failed to create batch");
      }

      const { batchId, domains } = await createRes.json();

      // Start processing
      const startRes = await fetch(`/api/batches/${batchId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domains }),
      });

      if (!startRes.ok) {
        const data = await startRes.json();
        throw new Error(data.error || "Failed to start batch");
      }

      // Initialize batch status
      setActiveBatch({
        batchId,
        status: "processing",
        progress: {
          total: domains.length,
          completed: 0,
          failed: 0,
          pending: domains.length,
          percentComplete: 0,
        },
        audits: [],
      });

      setStep("processing");
      onBatchStarted?.(batchId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start import");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Warn if processing
    if (step === "processing" && activeBatch?.status === "processing") {
      const confirmed = window.confirm(
        "Import is still running. It will continue in the background. Close anyway?"
      );
      if (!confirmed) return;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-background border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Upload className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">Bulk Import Domains</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === "input" && (
            <InputStep
              rawInput={rawInput}
              onRawInputChange={setRawInput}
              batchName={batchName}
              onBatchNameChange={setBatchName}
              validCount={parsedResult.valid.length}
              invalidCount={parsedResult.invalid.length}
            />
          )}

          {step === "preview" && (
            <PreviewStep
              validDomains={validDomains}
              invalidDomains={invalidDomains}
              batchName={batchName}
            />
          )}

          {step === "processing" && activeBatch && (
            <ProcessingStep batch={activeBatch} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="size-4" />
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 ml-auto">
            {step === "input" && (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handlePreview}
                  disabled={parsedResult.valid.length === 0}
                >
                  Preview ({parsedResult.valid.length} domains)
                </Button>
              </>
            )}

            {step === "preview" && (
              <>
                <Button variant="outline" onClick={() => setStep("input")}>
                  Back
                </Button>
                <Button
                  onClick={handleStartImport}
                  disabled={isSubmitting || validDomains.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="size-4" />
                      Start Import
                    </>
                  )}
                </Button>
              </>
            )}

            {step === "processing" && (
              <Button onClick={handleClose}>
                {activeBatch?.status === "processing" ? "Run in Background" : "Close"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Input step component
function InputStep({
  rawInput,
  onRawInputChange,
  batchName,
  onBatchNameChange,
  validCount,
  invalidCount,
}: {
  rawInput: string;
  onRawInputChange: (value: string) => void;
  batchName: string;
  onBatchNameChange: (value: string) => void;
  validCount: number;
  invalidCount: number;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Batch Name (optional)
        </label>
        <Input
          placeholder="e.g., Q1 2026 Prospects"
          value={batchName}
          onChange={(e) => onBatchNameChange(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Domains
        </label>
        <textarea
          placeholder="Paste domains here (one per line)&#10;&#10;Examples:&#10;example.com&#10;https://another-site.com&#10;www.vacation-rentals.net"
          value={rawInput}
          onChange={(e) => onRawInputChange(e.target.value)}
          className="w-full h-64 p-4 rounded-lg border border-input bg-background font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {(validCount > 0 || invalidCount > 0) && (
        <div className="flex items-center gap-4 text-sm">
          {validCount > 0 && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="size-4" />
              {validCount} valid
            </div>
          )}
          {invalidCount > 0 && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertCircle className="size-4" />
              {invalidCount} invalid
            </div>
          )}
        </div>
      )}

      <div className="p-4 rounded-lg bg-muted/50 border border-border">
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
          <FileText className="size-4" />
          Supported Formats
        </h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>One domain per line</li>
          <li>With or without https://</li>
          <li>With or without www (will be normalized)</li>
          <li>Duplicates will be removed automatically</li>
        </ul>
      </div>
    </div>
  );
}

// Preview step component
function PreviewStep({
  validDomains,
  invalidDomains,
  batchName,
}: {
  validDomains: string[];
  invalidDomains: { input: string; reason: string }[];
  batchName: string;
}) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-4">
        {batchName && (
          <div>
            <span className="text-sm text-muted-foreground">Batch Name:</span>{" "}
            <span className="font-medium">{batchName}</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-4">
          <Badge variant="success" className="text-sm">
            {validDomains.length} valid
          </Badge>
          {invalidDomains.length > 0 && (
            <Badge variant="warning" className="text-sm">
              {invalidDomains.length} invalid
            </Badge>
          )}
        </div>
      </div>

      {/* Valid domains table */}
      <div>
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
          <CheckCircle2 className="size-4 text-green-600" />
          Valid Domains
        </h4>
        <div className="border border-border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="text-left px-4 py-2 font-medium">#</th>
                <th className="text-left px-4 py-2 font-medium">Domain</th>
              </tr>
            </thead>
            <tbody>
              {validDomains.map((domain, index) => (
                <tr
                  key={domain}
                  className={cn(
                    "border-t border-border",
                    index % 2 === 0 ? "bg-background" : "bg-muted/20"
                  )}
                >
                  <td className="px-4 py-2 text-muted-foreground">{index + 1}</td>
                  <td className="px-4 py-2 font-mono">{domain}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invalid domains table */}
      {invalidDomains.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <XCircle className="size-4 text-amber-600" />
            Invalid Domains (will be skipped)
          </h4>
          <div className="border border-border rounded-lg overflow-hidden max-h-40 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Input</th>
                  <th className="text-left px-4 py-2 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {invalidDomains.map((item, index) => (
                  <tr
                    key={index}
                    className={cn(
                      "border-t border-border",
                      index % 2 === 0 ? "bg-background" : "bg-muted/20"
                    )}
                  >
                    <td className="px-4 py-2 font-mono text-muted-foreground">
                      {item.input}
                    </td>
                    <td className="px-4 py-2 text-amber-600">{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> Audits will be processed 3 at a time to respect
          API rate limits. The import will continue in the background if you close
          this modal.
        </p>
      </div>
    </div>
  );
}

// Processing step component
function ProcessingStep({ batch }: { batch: BatchStatus }) {
  const { progress, audits, status } = batch;
  const isComplete = status === "completed" || status === "failed";

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {isComplete ? (
              status === "completed" ? (
                "Import Complete"
              ) : (
                "Import Failed"
              )
            ) : (
              "Processing..."
            )}
          </span>
          <span className="text-sm text-muted-foreground">
            {progress.completed + progress.failed} / {progress.total}
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500",
              status === "failed"
                ? "bg-destructive"
                : status === "completed"
                ? "bg-green-500"
                : "bg-primary"
            )}
            style={{ width: `${progress.percentComplete}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm">
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="size-4" />
            {progress.completed} completed
          </span>
          {progress.failed > 0 && (
            <span className="flex items-center gap-1 text-destructive">
              <XCircle className="size-4" />
              {progress.failed} failed
            </span>
          )}
          {progress.pending > 0 && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {progress.pending} pending
            </span>
          )}
        </div>
      </div>

      {/* Audit list */}
      <div className="border border-border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="text-left px-4 py-2 font-medium">#</th>
              <th className="text-left px-4 py-2 font-medium">Domain</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {audits.map((audit, index) => (
              <tr
                key={audit.auditId || index}
                className={cn(
                  "border-t border-border",
                  index % 2 === 0 ? "bg-background" : "bg-muted/20"
                )}
              >
                <td className="px-4 py-2 text-muted-foreground">
                  {audit.position + 1}
                </td>
                <td className="px-4 py-2 font-mono">{audit.domain}</td>
                <td className="px-4 py-2">
                  {audit.status === "completed" ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="size-4" />
                      Done
                    </span>
                  ) : audit.status === "failed" ? (
                    <span className="flex items-center gap-1 text-destructive">
                      <XCircle className="size-4" />
                      Failed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Processing
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isComplete && (
        <div
          className={cn(
            "p-4 rounded-lg border",
            status === "completed"
              ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
          )}
        >
          <p
            className={cn(
              "text-sm",
              status === "completed"
                ? "text-green-800 dark:text-green-200"
                : "text-red-800 dark:text-red-200"
            )}
          >
            {status === "completed" ? (
              <>
                <strong>Success!</strong> {progress.completed} audits completed
                {progress.failed > 0 && `, ${progress.failed} failed`}. Refresh
                the admin page to see results.
              </>
            ) : (
              <>
                <strong>Import failed.</strong> Some audits may have completed
                before the failure. Check the results above.
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

export default BulkImportModal;
