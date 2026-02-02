"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  RefreshCw,
  Download,
  Search,
  Trash2,
  Loader2,
  Mail,
  Building2,
  Phone,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  Clock,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface Lead {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  phone: string | null;
  capturedAt: string;
  capturePoint: string;
  firstAuditId: string | null;
  reportsViewed: number;
  lastActiveAt: string | null;
  status: string;
  notes: string | null;
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination
  const [offset, setOffset] = useState(0);
  const [limit] = useState(50);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [capturePointFilter, setCapturePointFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Sort
  const [sortBy, setSortBy] = useState<"captured_at" | "email" | "reports_viewed">("captured_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selected lead for detail view
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadNotes, setLeadNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setOffset(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        sort: sortBy,
        order: sortOrder,
      });

      if (statusFilter) params.set("status", statusFilter);
      if (capturePointFilter) params.set("capture_point", capturePointFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();

      setLeads(data.leads || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setIsLoading(false);
    }
  }, [offset, limit, sortBy, sortOrder, statusFilter, capturePointFilter, debouncedSearch]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Update lead status
  const updateLeadStatus = async (leadId: string, status: string) => {
    setIsUpdating(true);
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchLeads();
      if (selectedLead?.id === leadId) {
        setSelectedLead({ ...selectedLead, status });
      }
    } catch (error) {
      console.error("Failed to update lead:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Update lead notes
  const updateLeadNotes = async () => {
    if (!selectedLead) return;
    setIsUpdating(true);
    try {
      await fetch(`/api/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: leadNotes }),
      });
      setSelectedLead({ ...selectedLead, notes: leadNotes });
    } catch (error) {
      console.error("Failed to update notes:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete lead
  const deleteLead = async (leadId: string) => {
    if (!confirm("Delete this lead? This cannot be undone.")) return;
    try {
      await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
      fetchLeads();
      if (selectedLead?.id === leadId) {
        setSelectedLead(null);
      }
    } catch (error) {
      console.error("Failed to delete lead:", error);
    }
  };

  // Export leads as CSV
  const exportLeads = async () => {
    const params = new URLSearchParams({
      limit: "10000",
      offset: "0",
      sort: sortBy,
      order: sortOrder,
    });

    if (statusFilter) params.set("status", statusFilter);
    if (capturePointFilter) params.set("capture_point", capturePointFilter);
    if (debouncedSearch) params.set("search", debouncedSearch);

    try {
      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      const leads = data.leads || [];

      // Build CSV
      const headers = ["Email", "Name", "Company", "Phone", "Status", "Capture Point", "Captured At", "Reports Viewed"];
      const rows = leads.map((lead: Lead) => [
        lead.email,
        lead.name || "",
        lead.company || "",
        lead.phone || "",
        lead.status,
        lead.capturePoint,
        lead.capturedAt,
        lead.reportsViewed.toString(),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row: string[]) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

      // Download
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export leads:", error);
    }
  };

  // Helpers
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusVariant = (status: string): "success" | "warning" | "secondary" | "error" => {
    switch (status) {
      case "converted":
        return "success";
      case "qualified":
      case "contacted":
        return "warning";
      case "new":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getCapturePointLabel = (point: string) => {
    switch (point) {
      case "scroll_80":
        return "Scroll Trigger";
      case "pre_gate":
        return "Pre-Gate";
      case "pdf_offer":
        return "PDF Offer";
      default:
        return point;
    }
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  const hasFilters = statusFilter || capturePointFilter || debouncedSearch;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => window.location.href = "/admin"}>
              <ArrowLeft className="size-4" />
            </Button>
            <h1 className="text-xl font-bold">Lead Management</h1>
            <Badge variant="outline">{total} leads</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportLeads}>
              <Download className="size-4" />
              Export
            </Button>
            <Button variant="ghost" size="sm" onClick={fetchLeads}>
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="size-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{total}</div>
                <div className="text-xs text-muted-foreground">Total Leads</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <UserPlus className="size-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">
                  {leads.filter((l) => l.status === "new").length}
                </div>
                <div className="text-xs text-muted-foreground">New Leads</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="size-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">
                  {leads.filter((l) => l.status === "contacted").length}
                </div>
                <div className="text-xs text-muted-foreground">Contacted</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="size-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">
                  {leads.filter((l) => l.status === "converted").length}
                </div>
                <div className="text-xs text-muted-foreground">Converted</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex gap-6">
          {/* Lead list */}
          <Card className="flex-1">
            <CardHeader className="pb-4">
              <div className="flex flex-wrap gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search email, name, company..."
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
                    setOffset(0);
                  }}
                  className="h-10 px-3 rounded-md border border-border bg-background text-sm"
                >
                  <option value="">All statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                </select>

                {/* Capture point filter */}
                <select
                  value={capturePointFilter}
                  onChange={(e) => {
                    setCapturePointFilter(e.target.value);
                    setOffset(0);
                  }}
                  className="h-10 px-3 rounded-md border border-border bg-background text-sm"
                >
                  <option value="">All sources</option>
                  <option value="scroll_80">Scroll Trigger</option>
                  <option value="pre_gate">Pre-Gate</option>
                  <option value="pdf_offer">PDF Offer</option>
                </select>

                {hasFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStatusFilter("");
                      setCapturePointFilter("");
                      setSearchQuery("");
                      setOffset(0);
                    }}
                  >
                    <X className="size-4" />
                    Clear
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {hasFilters ? "No leads match your filters" : "No leads captured yet"}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {leads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => {
                          setSelectedLead(lead);
                          setLeadNotes(lead.notes || "");
                        }}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedLead?.id === lead.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-border/80 hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{lead.email}</span>
                              <Badge variant={getStatusVariant(lead.status)} className="capitalize">
                                {lead.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              {lead.name && <span>{lead.name}</span>}
                              {lead.company && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="size-3" />
                                  {lead.company}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <div className="text-muted-foreground">{formatDate(lead.capturedAt)}</div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Eye className="size-3" />
                              {lead.reportsViewed} views
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOffset(Math.max(0, offset - limit))}
                        disabled={offset === 0}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOffset(offset + limit)}
                        disabled={currentPage >= totalPages}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Lead detail panel */}
          {selectedLead && (
            <Card className="w-96 shrink-0">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Lead Details</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedLead(null)}>
                    <X className="size-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Contact info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="size-4 text-muted-foreground" />
                    <span className="font-medium">{selectedLead.email}</span>
                  </div>
                  {selectedLead.name && (
                    <div className="flex items-center gap-3">
                      <span className="size-4" />
                      <span>{selectedLead.name}</span>
                    </div>
                  )}
                  {selectedLead.company && (
                    <div className="flex items-center gap-3">
                      <Building2 className="size-4 text-muted-foreground" />
                      <span>{selectedLead.company}</span>
                    </div>
                  )}
                  {selectedLead.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="size-4 text-muted-foreground" />
                      <span>{selectedLead.phone}</span>
                    </div>
                  )}
                </div>

                {/* Status selector */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <select
                    value={selectedLead.status}
                    onChange={(e) => updateLeadStatus(selectedLead.id, e.target.value)}
                    disabled={isUpdating}
                    className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="converted">Converted</option>
                  </select>
                </div>

                {/* Metadata */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Captured</span>
                    <span>{formatDate(selectedLead.capturedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Source</span>
                    <span>{getCapturePointLabel(selectedLead.capturePoint)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reports Viewed</span>
                    <span>{selectedLead.reportsViewed}</span>
                  </div>
                  {selectedLead.lastActiveAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Active</span>
                      <span>{formatDate(selectedLead.lastActiveAt)}</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Notes</label>
                  <textarea
                    value={leadNotes}
                    onChange={(e) => setLeadNotes(e.target.value)}
                    placeholder="Add notes about this lead..."
                    className="w-full h-24 p-3 rounded-md border border-border bg-background text-sm resize-none"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={updateLeadNotes}
                    disabled={isUpdating || leadNotes === (selectedLead.notes || "")}
                  >
                    {isUpdating ? <Loader2 className="size-4 animate-spin" /> : "Save Notes"}
                  </Button>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-border">
                  {selectedLead.firstAuditId && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mb-2"
                      onClick={() => window.open(`/report/${selectedLead.firstAuditId}`, "_blank")}
                    >
                      <Eye className="size-4" />
                      View First Report
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => deleteLead(selectedLead.id)}
                  >
                    <Trash2 className="size-4" />
                    Delete Lead
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
