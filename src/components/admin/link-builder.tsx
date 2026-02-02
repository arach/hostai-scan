"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Copy,
  Check,
  Link2,
  ChevronDown,
  QrCode,
  Download,
  Calendar,
  Tag,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LinkBuilderProps {
  baseUrl: string;
  auditId?: string;
  domain?: string;
}

interface UtmParams {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
}

interface LinkSettings {
  customSlug: string | null;
  expiresAt: string | null;
  defaultUtmSource: string | null;
  defaultUtmMedium: string | null;
  defaultUtmCampaign: string | null;
  linkCopies: number;
  qrDownloads: number;
}

// Preset options for common UTM values
const UTM_PRESETS = {
  source: [
    { label: "Email", value: "email" },
    { label: "LinkedIn", value: "linkedin" },
    { label: "Direct", value: "direct" },
    { label: "Slack", value: "slack" },
    { label: "Twitter", value: "twitter" },
  ],
  medium: [
    { label: "Sales", value: "sales" },
    { label: "Marketing", value: "marketing" },
    { label: "Partner", value: "partner" },
    { label: "Referral", value: "referral" },
    { label: "Organic", value: "organic" },
  ],
  campaign: [
    { label: "Q1 Outreach", value: "q1-outreach" },
    { label: "Demo Followup", value: "demo-followup" },
    { label: "Cold Outreach", value: "cold-outreach" },
    { label: "Warm Lead", value: "warm-lead" },
    { label: "Re-engagement", value: "re-engagement" },
  ],
};

export function LinkBuilder({ baseUrl, auditId, domain }: LinkBuilderProps) {
  const [utmParams, setUtmParams] = useState<UtmParams>({
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
  });
  const [copied, setCopied] = useState(false);
  const [showPresets, setShowPresets] = useState<keyof UtmParams | null>(null);

  // Enhanced link settings
  const [customSlug, setCustomSlug] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // QR code state
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  // Link stats
  const [linkStats, setLinkStats] = useState<{
    copies: number;
    downloads: number;
  }>({ copies: 0, downloads: 0 });

  // Load existing link settings
  useEffect(() => {
    if (!auditId) return;

    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/audit/${auditId}/link`);
        if (response.ok) {
          const data: LinkSettings = await response.json();
          if (data.customSlug) setCustomSlug(data.customSlug);
          if (data.expiresAt) {
            // Convert to date input format (YYYY-MM-DD)
            const date = new Date(data.expiresAt);
            setExpiresAt(date.toISOString().split("T")[0]);
          }
          if (data.defaultUtmSource || data.defaultUtmMedium || data.defaultUtmCampaign) {
            setUtmParams({
              utm_source: data.defaultUtmSource || "",
              utm_medium: data.defaultUtmMedium || "",
              utm_campaign: data.defaultUtmCampaign || "",
            });
          }
          setLinkStats({
            copies: data.linkCopies || 0,
            downloads: data.qrDownloads || 0,
          });
        }
      } catch (error) {
        console.error("Failed to load link settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [auditId]);

  // Build the full URL with UTM params
  const fullUrl = useMemo(() => {
    // Use custom slug URL if available
    let urlBase = baseUrl;
    if (customSlug && auditId) {
      // Replace /report/[auditId] with /r/[slug]
      const baseOrigin = new URL(baseUrl).origin;
      urlBase = `${baseOrigin}/r/${customSlug}`;
    }

    const url = new URL(urlBase);

    if (utmParams.utm_source) {
      url.searchParams.set("utm_source", utmParams.utm_source);
    }
    if (utmParams.utm_medium) {
      url.searchParams.set("utm_medium", utmParams.utm_medium);
    }
    if (utmParams.utm_campaign) {
      url.searchParams.set("utm_campaign", utmParams.utm_campaign);
    }

    return url.toString();
  }, [baseUrl, customSlug, auditId, utmParams]);

  // Check if any UTM params are set
  const hasUtmParams =
    utmParams.utm_source || utmParams.utm_medium || utmParams.utm_campaign;

  // Track link copy
  const trackCopy = useCallback(async () => {
    if (!auditId) return;
    try {
      await fetch(`/api/audit/${auditId}/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "copy" }),
      });
      setLinkStats((prev) => ({ ...prev, copies: prev.copies + 1 }));
    } catch (error) {
      console.error("Failed to track copy:", error);
    }
  }, [auditId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      trackCopy();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handlePresetSelect = (field: keyof UtmParams, value: string) => {
    setUtmParams((prev) => ({ ...prev, [field]: value }));
    setShowPresets(null);
  };

  const handleInputChange = (field: keyof UtmParams, value: string) => {
    // Sanitize: lowercase, replace spaces with hyphens, remove special chars
    const sanitized = value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-_]/g, "");
    setUtmParams((prev) => ({ ...prev, [field]: sanitized }));
  };

  const handleSlugChange = (value: string) => {
    const sanitized = value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    setCustomSlug(sanitized);
    setSlugError(null);
  };

  const clearAll = () => {
    setUtmParams({ utm_source: "", utm_medium: "", utm_campaign: "" });
  };

  // Save link settings
  const saveSettings = async () => {
    if (!auditId) return;

    setIsSaving(true);
    setSlugError(null);

    try {
      const response = await fetch(`/api/audit/${auditId}/link`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customSlug: customSlug || null,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          defaultUtmSource: utmParams.utm_source || null,
          defaultUtmMedium: utmParams.utm_medium || null,
          defaultUtmCampaign: utmParams.utm_campaign || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 409) {
          setSlugError("This slug is already in use");
        } else {
          setSlugError(error.error || "Failed to save settings");
        }
        return;
      }

      // Settings saved successfully
    } catch (error) {
      console.error("Failed to save link settings:", error);
      setSlugError("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Generate QR code
  const generateQrCode = async () => {
    if (!auditId) return;

    setIsGeneratingQr(true);
    try {
      const response = await fetch(`/api/audit/${auditId}/qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          includeUtm: true,
          utmSource: utmParams.utm_source || undefined,
          utmMedium: utmParams.utm_medium || undefined,
          utmCampaign: utmParams.utm_campaign || undefined,
          trackDownload: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qrCode);
      }
    } catch (error) {
      console.error("Failed to generate QR code:", error);
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // Download QR code
  const downloadQrCode = async () => {
    if (!qrCode || !auditId) return;

    // Track download
    try {
      await fetch(`/api/audit/${auditId}/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "qr_download" }),
      });
      setLinkStats((prev) => ({ ...prev, downloads: prev.downloads + 1 }));
    } catch (error) {
      console.error("Failed to track download:", error);
    }

    // Download the image
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `${domain || auditId}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="size-4" />
            Link Builder
          </CardTitle>
          {hasUtmParams && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-7 text-xs"
            >
              Clear UTM
            </Button>
          )}
        </div>
        {domain && (
          <p className="text-sm text-muted-foreground">
            Create trackable links for{" "}
            <span className="font-medium">{domain}</span>
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Custom Slug */}
        {auditId && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Tag className="size-3.5" />
              Custom Slug (optional)
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  /r/
                </span>
                <Input
                  placeholder="my-custom-url"
                  value={customSlug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            {slugError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {slugError}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              3-50 characters, lowercase letters, numbers, and hyphens only
            </p>
          </div>
        )}

        {/* UTM Source */}
        <UtmField
          label="Source"
          placeholder="e.g., email, linkedin"
          value={utmParams.utm_source}
          onChange={(value) => handleInputChange("utm_source", value)}
          presets={UTM_PRESETS.source}
          showPresets={showPresets === "utm_source"}
          onTogglePresets={() =>
            setShowPresets(showPresets === "utm_source" ? null : "utm_source")
          }
          onPresetSelect={(value) => handlePresetSelect("utm_source", value)}
        />

        {/* UTM Medium */}
        <UtmField
          label="Medium"
          placeholder="e.g., sales, marketing"
          value={utmParams.utm_medium}
          onChange={(value) => handleInputChange("utm_medium", value)}
          presets={UTM_PRESETS.medium}
          showPresets={showPresets === "utm_medium"}
          onTogglePresets={() =>
            setShowPresets(showPresets === "utm_medium" ? null : "utm_medium")
          }
          onPresetSelect={(value) => handlePresetSelect("utm_medium", value)}
        />

        {/* UTM Campaign */}
        <UtmField
          label="Campaign"
          placeholder="e.g., q1-outreach"
          value={utmParams.utm_campaign}
          onChange={(value) => handleInputChange("utm_campaign", value)}
          presets={UTM_PRESETS.campaign}
          showPresets={showPresets === "utm_campaign"}
          onTogglePresets={() =>
            setShowPresets(
              showPresets === "utm_campaign" ? null : "utm_campaign"
            )
          }
          onPresetSelect={(value) => handlePresetSelect("utm_campaign", value)}
        />

        {/* Advanced Options Toggle */}
        {auditId && (
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                showAdvanced && "rotate-180"
              )}
            />
            {showAdvanced ? "Hide" : "Show"} advanced options
          </button>
        )}

        {/* Advanced Options */}
        {showAdvanced && auditId && (
          <div className="space-y-4 pt-2 border-t">
            {/* Expiration Date */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                Expiration Date (optional)
              </label>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
              <p className="text-xs text-muted-foreground">
                Report will show an expired message after this date
              </p>
            </div>

            {/* Save Settings Button */}
            <Button
              onClick={saveSettings}
              disabled={isSaving}
              variant="secondary"
              className="w-full"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Link Settings"
              )}
            </Button>

            {/* QR Code Section */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <QrCode className="size-3.5" />
                  QR Code
                </label>
                <Button
                  onClick={generateQrCode}
                  disabled={isGeneratingQr}
                  variant="outline"
                  size="sm"
                >
                  {isGeneratingQr ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <QrCode className="size-4" />
                      Generate
                    </>
                  )}
                </Button>
              </div>

              {qrCode && (
                <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-lg border">
                  <img
                    src={qrCode}
                    alt="QR Code"
                    className="w-40 h-40"
                  />
                  <Button
                    onClick={downloadQrCode}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Download className="size-4" />
                    Download QR Code
                  </Button>
                </div>
              )}
            </div>

            {/* Link Stats */}
            {(linkStats.copies > 0 || linkStats.downloads > 0) && (
              <div className="flex gap-4 text-xs text-muted-foreground pt-2 border-t">
                <span>
                  <strong>{linkStats.copies}</strong> link copies
                </span>
                <span>
                  <strong>{linkStats.downloads}</strong> QR downloads
                </span>
              </div>
            )}
          </div>
        )}

        {/* URL Preview */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Preview
          </label>
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <code className="text-xs break-all text-foreground/80">
              {fullUrl}
            </code>
          </div>
        </div>

        {/* Copy Button */}
        <Button
          onClick={handleCopy}
          className="w-full"
          variant={copied ? "secondary" : "default"}
        >
          {copied ? (
            <>
              <Check className="size-4" />
              Copied to Clipboard
            </>
          ) : (
            <>
              <Copy className="size-4" />
              Copy Link
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// Helper component for UTM input fields with presets
interface UtmFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  presets: { label: string; value: string }[];
  showPresets: boolean;
  onTogglePresets: () => void;
  onPresetSelect: (value: string) => void;
}

function UtmField({
  label,
  placeholder,
  value,
  onChange,
  presets,
  showPresets,
  onTogglePresets,
  onPresetSelect,
}: UtmFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10"
        />
        <button
          type="button"
          onClick={onTogglePresets}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted transition-colors",
            showPresets && "bg-muted"
          )}
        >
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              showPresets && "rotate-180"
            )}
          />
        </button>
      </div>
      {showPresets && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {presets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => onPresetSelect(preset.value)}
              className={cn(
                "px-2.5 py-1 text-xs rounded-md border transition-colors",
                value === preset.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 border-border hover:bg-muted hover:border-muted-foreground/20"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LinkBuilder;
