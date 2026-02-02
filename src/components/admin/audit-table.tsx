"use client";

import { useState, useCallback, useEffect, Fragment } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Trash2,
  RefreshCw,
  Download,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Search,
  X,
  Eye,
  Link2,
  LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkBuilder } from "./link-builder";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface AuditItem {
  id: string;
  domain: string;
  status: string;
  score: number | null;
  createdAt: string;
  completedAt: string | null;
  batchId: string | null;
  viewCount: number;
}

interface AuditTableProps {
  onRerunAudit?: (domain: string) => void;
}

type SortField = "score" | "created_at" | "domain" | "views";
type SortOrder = "asc" | "desc";

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function AuditTable({ onRerunAudit }: AuditTableProps) {
  // Data state
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // Sort state
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [scoreMin, setScoreMin] = useState<string>("");
  const [scoreMax, setScoreMax] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectAll, setIsSelectAll] = useState(false);

  // UI state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedLinkBuilder, setExpandedLinkBuilder] = useState<string | null>(null);
  const [showBulkUrlModal, setShowBulkUrlModal] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch audits
  const fetchAudits = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        sort: sortField,
        order: sortOrder,
        page: page.toString(),
        limit: limit.toString(),
      });

      if (statusFilter) params.set("status", statusFilter);
      if (scoreMin) params.set("score_min", scoreMin);
      if (scoreMax) params.set("score_max", scoreMax);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/audits?${params}`);
      const data = await res.json();

      setAudits(data.audits || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch audits:", error);
    } finally {
      setIsLoading(false);
    }
  }, [sortField, sortOrder, page, limit, statusFilter, scoreMin, scoreMax, debouncedSearch]);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  // Handle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setIsSelectAll(false);
  };

  const toggleSelectAll = () => {
    if (isSelectAll) {
      setSelectedIds(new Set());
      setIsSelectAll(false);
    } else {
      setSelectedIds(new Set(audits.map((a) => a.id)));
      setIsSelectAll(true);
    }
  };

  // Handle copy URL
  const copyUrl = async (auditId: string) => {
    const url = `${baseUrl}/report/${auditId}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(auditId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} audit(s)? This cannot be undone.`)) return;

    setIsDeleting(true);
    try {
      const res = await fetch("/api/audits", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditIds: Array.from(selectedIds) }),
      });

      if (res.ok) {
        setSelectedIds(new Set());
        setIsSelectAll(false);
        fetchAudits();
      }
    } catch (error) {
      console.error("Failed to delete audits:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle export
  const handleExport = () => {
    const params = new URLSearchParams({
      sort: sortField,
      order: sortOrder,
    });

    if (statusFilter) params.set("status", statusFilter);
    if (scoreMin) params.set("score_min", scoreMin);
    if (scoreMax) params.set("score_max", scoreMax);
    if (debouncedSearch) params.set("search", debouncedSearch);

    window.location.href = `/api/audits/export?${params}`;
  };

  // Reset filters
  const clearFilters = () => {
    setStatusFilter("");
    setScoreMin("");
    setScoreMax("");
    setSearchQuery("");
    setDebouncedSearch("");
    setPage(1);
  };

  const hasFilters = statusFilter || scoreMin || scoreMax || debouncedSearch;

  // Format helpers
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreVariant = (score: number | null): "success" | "warning" | "error" | "secondary" => {
    if (score === null) return "secondary";
    if (score >= 70) return "success";
    if (score >= 50) return "warning";
    return "error";
  };

  const getStatusVariant = (status: string): "success" | "warning" | "error" | "secondary" => {
    switch (status) {
      case "completed":
        return "success";
      case "pending":
      case "running":
        return "warning";
      case "failed":
        return "error";
      default:
        return "secondary";
    }
  };

  // Sort icon helper
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="size-3 opacity-50" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="size-3" />
    ) : (
      <ArrowDown className="size-3" />
    );
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Audit Table</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{total} total</Badge>
            <Button variant="ghost" size="sm" onClick={fetchAudits}>
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mt-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search domains..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 rounded-md border border-border bg-background text-sm"
          >
            <option value="">All statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          {/* Score range */}
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={scoreMin}
              onChange={(e) => {
                setScoreMin(e.target.value);
                setPage(1);
              }}
              className="w-20"
              min={0}
              max={100}
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="Max"
              value={scoreMax}
              onChange={(e) => {
                setScoreMax(e.target.value);
                setPage(1);
              }}
              className="w-20"
              min={0}
              max={100}
            />
          </div>

          {/* Clear filters */}
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="size-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-muted/50 border border-border">
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkUrlModal(true)}
            >
              <LinkIcon className="size-4" />
              Generate URLs
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="size-4" />
              Export
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : audits.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {hasFilters ? "No audits match your filters" : "No audits yet"}
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={isSelectAll && audits.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="p-3 text-left">
                      <button
                        onClick={() => handleSort("domain")}
                        className="flex items-center gap-1 font-medium text-sm hover:text-foreground"
                      >
                        Domain
                        <SortIcon field="domain" />
                      </button>
                    </th>
                    <th className="p-3 text-center w-20">
                      <button
                        onClick={() => handleSort("score")}
                        className="flex items-center gap-1 font-medium text-sm hover:text-foreground mx-auto"
                      >
                        Score
                        <SortIcon field="score" />
                      </button>
                    </th>
                    <th className="p-3 text-center w-24">Status</th>
                    <th className="p-3 text-center w-20">
                      <button
                        onClick={() => handleSort("views")}
                        className="flex items-center gap-1 font-medium text-sm hover:text-foreground mx-auto"
                      >
                        Views
                        <SortIcon field="views" />
                      </button>
                    </th>
                    <th className="p-3 text-left w-40">
                      <button
                        onClick={() => handleSort("created_at")}
                        className="flex items-center gap-1 font-medium text-sm hover:text-foreground"
                      >
                        Created
                        <SortIcon field="created_at" />
                      </button>
                    </th>
                    <th className="p-3 text-right w-48">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map((audit) => (
                    <Fragment key={audit.id}>
                      <tr
                        className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                          expandedLinkBuilder === audit.id ? "bg-muted/30" : ""
                        }`}
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(audit.id)}
                            onChange={() => toggleSelect(audit.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-3">
                          <div className="font-medium truncate max-w-[200px]">
                            {audit.domain}
                          </div>
                          {audit.batchId && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Batch: {audit.batchId.slice(0, 8)}...
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={getScoreVariant(audit.score)}>
                            {audit.score !== null ? audit.score : "--"}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={getStatusVariant(audit.status)} className="capitalize">
                            {audit.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                            <Eye className="size-3" />
                            {audit.viewCount}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {formatDate(audit.createdAt)}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1">
                            {onRerunAudit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRerunAudit(audit.domain)}
                                title="Re-run audit"
                              >
                                <RefreshCw className="size-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyUrl(audit.id)}
                              title="Copy URL"
                            >
                              {copiedId === audit.id ? (
                                <Check className="size-4 text-success" />
                              ) : (
                                <Copy className="size-4" />
                              )}
                            </Button>
                            <Button
                              variant={expandedLinkBuilder === audit.id ? "secondary" : "ghost"}
                              size="sm"
                              onClick={() =>
                                setExpandedLinkBuilder(
                                  expandedLinkBuilder === audit.id ? null : audit.id
                                )
                              }
                              title="UTM Link Builder"
                            >
                              <Link2 className="size-4" />
                              <ChevronDown
                                className={`size-3 transition-transform ${
                                  expandedLinkBuilder === audit.id ? "rotate-180" : ""
                                }`}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/report/${audit.id}`, "_blank")}
                              title="View report"
                            >
                              <ExternalLink className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {/* Expanded Link Builder Row */}
                      {expandedLinkBuilder === audit.id && (
                        <tr>
                          <td colSpan={7} className="p-0">
                            <div className="bg-muted/30 border-b border-border p-4">
                              <LinkBuilder
                                baseUrl={`${baseUrl}/report/${audit.id}`}
                                auditId={audit.id}
                                domain={audit.domain}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(parseInt(e.target.value, 10));
                    setPage(1);
                  }}
                  className="h-8 px-2 rounded border border-border bg-background text-sm"
                >
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>

      {/* Bulk URL Generator Modal */}
      {showBulkUrlModal && (
        <BulkUrlModal
          audits={audits.filter((a) => selectedIds.has(a.id))}
          baseUrl={baseUrl}
          onClose={() => setShowBulkUrlModal(false)}
        />
      )}
    </Card>
  );
}

// -----------------------------------------------------------------------------
// Bulk URL Generator Modal
// -----------------------------------------------------------------------------

interface BulkUrlModalProps {
  audits: AuditItem[];
  baseUrl: string;
  onClose: () => void;
}

function BulkUrlModal({ audits, baseUrl, onClose }: BulkUrlModalProps) {
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [copied, setCopied] = useState(false);

  // Generate URLs with UTM params
  const generatedUrls = audits.map((audit) => {
    let url = `${baseUrl}/report/${audit.id}`;
    const params = new URLSearchParams();
    if (utmSource) params.set("utm_source", utmSource);
    if (utmMedium) params.set("utm_medium", utmMedium);
    if (utmCampaign) params.set("utm_campaign", utmCampaign);
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    return { domain: audit.domain, url };
  });

  // Copy all URLs
  const copyAll = async () => {
    const text = generatedUrls.map((u) => `${u.domain}\t${u.url}`).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export as CSV
  const exportCsv = () => {
    const headers = "Domain,URL";
    const rows = generatedUrls.map((u) => `"${u.domain}","${u.url}"`);
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `urls-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">
              Generate URLs ({audits.length} audits)
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>

          {/* UTM Params */}
          <div className="p-4 border-b border-border space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  UTM Source
                </label>
                <Input
                  placeholder="e.g., email"
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  UTM Medium
                </label>
                <Input
                  placeholder="e.g., outreach"
                  value={utmMedium}
                  onChange={(e) => setUtmMedium(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  UTM Campaign
                </label>
                <Input
                  placeholder="e.g., q1-2026"
                  value={utmCampaign}
                  onChange={(e) => setUtmCampaign(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setUtmSource("email");
                  setUtmMedium("outreach");
                }}
              >
                Email Preset
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setUtmSource("linkedin");
                  setUtmMedium("social");
                }}
              >
                LinkedIn Preset
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setUtmSource("");
                  setUtmMedium("");
                  setUtmCampaign("");
                }}
              >
                Clear
              </Button>
            </div>
          </div>

          {/* URL List */}
          <div className="flex-1 overflow-auto p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 font-medium">Domain</th>
                  <th className="text-left p-2 font-medium">URL</th>
                </tr>
              </thead>
              <tbody>
                {generatedUrls.map((item, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="p-2 font-medium">{item.domain}</td>
                    <td className="p-2 text-muted-foreground truncate max-w-[300px]">
                      {item.url}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
            <Button variant="outline" onClick={exportCsv}>
              <Download className="size-4" />
              Export CSV
            </Button>
            <Button onClick={copyAll}>
              {copied ? (
                <>
                  <Check className="size-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  Copy All (Tab-separated)
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
