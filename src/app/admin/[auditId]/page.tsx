"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Highlight, themes } from "prism-react-renderer";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Database,
  Clock,
  Globe,
  Server,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  Activity,
  Shield,
  FileCode,
  Gauge,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemePicker } from "@/components/theme-picker";
import type { AuditResult } from "@/types/audit";

// ============================================================================
// Navigation Sections Config
// ============================================================================

const NAV_SECTIONS = [
  { id: "overview", label: "Overview", subsections: ["Score Ring", "Category Breakdown", "Data Sources Status"] },
  { id: "recommendations-preview", label: "Top Issues", subsections: ["Priority Issues", "Quick Stats"] },
  { id: "booking-trust-section", label: "Booking & Trust", subsections: ["Booking Flow", "Trust Signals"] },
  { id: "seo-section", label: "SEO Metrics", subsections: ["DataForSEO", "SEMrush Comparison"] },
  { id: "semrush-section", label: "SEMrush Data", subsections: ["Domain Rank", "Backlinks", "Top Keywords", "Referring Domains"] },
  { id: "revenue-section", label: "Revenue Impact", subsections: ["Score Gap", "Monthly Loss"] },
  { id: "data-sources-section", label: "Data Sources", subsections: ["Core Web Vitals", "Lighthouse", "SEO", "Booking Flow", "Trust Signals"] },
  { id: "recommendations-section", label: "All Recommendations", subsections: ["By Category", "Pass/Fail/Warning"] },
  { id: "raw-api-section", label: "Raw API Data", subsections: ["HTML", "PageSpeed", "DataForSEO", "SEMrush"] },
  { id: "full-result-section", label: "Full Result", subsections: ["Complete JSON"] },
];

// ============================================================================
// useActiveSection Hook - Tracks which section is currently in view
// ============================================================================

function useActiveSection(sectionIds: string[]) {
  const [activeSection, setActiveSection] = useState<string>(sectionIds[0] || "");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Disconnect previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const callback: IntersectionObserverCallback = (entries) => {
      // Find the first section that is intersecting from the top
      const visibleSections = entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => ({
          id: entry.target.id,
          top: entry.boundingClientRect.top,
        }))
        .sort((a, b) => a.top - b.top);

      if (visibleSections.length > 0) {
        setActiveSection(visibleSections[0].id);
      }
    };

    observerRef.current = new IntersectionObserver(callback, {
      rootMargin: "-20% 0px -60% 0px", // Trigger when section is in upper portion of viewport
      threshold: 0,
    });

    // Observe all sections
    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observerRef.current?.observe(element);
      }
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [sectionIds]);

  return activeSection;
}

// ============================================================================
// Copy Button - Reusable copy to clipboard
// ============================================================================

function CopyButton({
  value,
  className = "",
  size = "sm",
}: {
  value: string;
  className?: string;
  size?: "xs" | "sm";
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (size === "xs") {
    return (
      <button
        onClick={handleCopy}
        className={`inline-flex items-center justify-center size-5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors ${className}`}
        title="Copy to clipboard"
      >
        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-7 px-2 ${className}`}
      onClick={handleCopy}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

// ============================================================================
// JSON Block - Code block with Prism syntax highlighting
// ============================================================================

function JsonBlock({
  data,
  maxHeight = "max-h-96",
  label,
}: {
  data: unknown;
  maxHeight?: string;
  label?: string;
}) {
  const jsonStr = JSON.stringify(data, null, 2);

  return (
    <div className="relative group">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </span>
          <CopyButton value={jsonStr} />
        </div>
      )}
      <div className="relative">
        {!label && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <CopyButton value={jsonStr} size="xs" className="bg-background/80" />
          </div>
        )}
        <Highlight theme={themes.nightOwl} code={jsonStr} language="json">
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className={`text-xs p-4 rounded-lg overflow-auto ${maxHeight} border border-border/50`}
              style={{ ...style, background: "hsl(var(--background) / 0.5)" }}
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
}

// ============================================================================
// Types
// ============================================================================

interface StoredAudit {
  id: string;
  domain: string;
  createdAt: string;
  completedAt: string;
  result: AuditResult;
}

interface RequestInfo {
  method: "GET" | "POST";
  url: string;
  headers: Record<string, string>;
  body?: string;
}

// SEMrush parsed data types
interface SEMrushKeyword {
  keyword: string;
  position: number;
  previousPosition: number | null;
  searchVolume: number;
  traffic: number;
  trafficPercent: number;
  cpc: number;
  url: string;
}

interface SEMrushRefDomain {
  domain: string;
  backlinksCount: number;
  firstSeen: string;
  lastSeen: string;
}

interface SEMrushParsedData {
  domainRanks: {
    rank: number;
    organicKeywords: number;
    organicTraffic: number;
    organicCost: number;
    adwordsKeywords: number;
    adwordsTraffic: number;
    adwordsCost: number;
  } | null;
  backlinks: {
    authorityScore: number;
    totalBacklinks: number;
    referringDomains: number;
    referringUrls: number;
    referringIps: number;
    followLinks: number;
    nofollowLinks: number;
  } | null;
  topKeywords: SEMrushKeyword[];
  refDomains: SEMrushRefDomain[];
}

interface RawApiData {
  htmlFetch?: {
    request: RequestInfo;
    response: {
      statusCode: number;
      contentLength: number;
      headers: Record<string, string>;
      loadTimeMs: number;
      fetchedAt: string;
      error?: string;
    };
  };
  pageSpeed?: { request: RequestInfo; response: unknown };
  dataForSEO?: { request: RequestInfo; response: unknown };
  semrush?: { request: RequestInfo; response: unknown; parsed?: SEMrushParsedData };
}

// ============================================================================
// Score Ring Component - SVG Circular Gauge
// ============================================================================

function ScoreRing({
  score,
  projectedScore,
  size = 160,
}: {
  score: number;
  projectedScore?: number;
  size?: number;
}) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const strokeWidth = 8;
  const padding = 8; // Extra padding for glow effect
  const radius = (size - strokeWidth - padding) / 2;
  const circumference = 2 * Math.PI * radius;

  // Animate score on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const scoreOffset = circumference - (animatedScore / 100) * circumference;
  const projectedOffset = projectedScore
    ? circumference - (projectedScore / 100) * circumference
    : circumference;

  // Color based on score
  const getScoreColor = (s: number) => {
    if (s >= 70) return { stroke: "url(#scoreGradientGreen)", glow: "rgba(34, 197, 94, 0.4)" };
    if (s >= 50) return { stroke: "url(#scoreGradientAmber)", glow: "rgba(245, 158, 11, 0.4)" };
    return { stroke: "url(#scoreGradientRed)", glow: "rgba(239, 68, 68, 0.4)" };
  };

  const colors = getScoreColor(score);

  const svgSize = size + padding * 2;
  const center = svgSize / 2;

  return (
    <div className="relative" style={{ width: svgSize, height: svgSize }}>
      <svg
        className="transform -rotate-90"
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
      >
        <defs>
          <linearGradient id="scoreGradientGreen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
          <linearGradient id="scoreGradientAmber" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="scoreGradientRed" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#f87171" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          opacity={0.3}
        />

        {/* Projected score ghost arc */}
        {projectedScore && projectedScore > score && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={projectedOffset}
            strokeLinecap="round"
            opacity={0.2}
          />
        )}

        {/* Main score arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={scoreOffset}
          strokeLinecap="round"
          filter="url(#glow)"
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-5xl font-bold tabular-nums tracking-tight">
          {animatedScore}
        </span>
        <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
          Score
        </span>
        {projectedScore && projectedScore > score && (
          <span className="text-xs text-muted-foreground mt-2">
            → {projectedScore} projected
          </span>
        )}
      </div>

      {/* Pulse glow effect */}
      <div
        className="absolute inset-0 rounded-full animate-pulse opacity-20"
        style={{
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
          animationDuration: "3s",
        }}
      />
    </div>
  );
}

// ============================================================================
// Status Bar - Horizontal System Status Strip
// ============================================================================

function StatusBar({
  dataSources,
}: {
  dataSources: Record<string, boolean>;
}) {
  const activeCount = Object.values(dataSources).filter(Boolean).length;
  const totalCount = Object.keys(dataSources).length;

  const sourceLabels: Record<string, string> = {
    htmlAnalysis: "HTML",
    pageSpeed: "PageSpeed",
    coreWebVitals: "CWV",
    seoData: "SEO",
    bookingFlowAnalysis: "Booking",
    trustSignalAnalysis: "Trust",
  };

  return (
    <div className="flex items-center gap-4 px-3 py-2 bg-muted/30 rounded-lg border border-border/50">
      {/* Data Sources */}
      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(dataSources).map(([key, active]) => (
          <div
            key={key}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs ${
              active ? "bg-success/10 text-success" : "bg-muted/50 text-muted-foreground/50"
            }`}
            title={sourceLabels[key] || key}
          >
            <div
              className={`size-1.5 rounded-full ${
                active ? "bg-success" : "bg-muted-foreground/30"
              }`}
            />
            <span className="whitespace-nowrap">
              {sourceLabels[key] || key}
            </span>
          </div>
        ))}
      </div>

      <div className="h-4 w-px bg-border/50" />

      {/* Count */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Database className="size-3" />
        <span className="font-mono">
          {activeCount}/{totalCount}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Category Bar - Horizontal Progress Bar
// ============================================================================

function CategoryBar({
  name,
  score,
  weight,
  source,
}: {
  name: string;
  score: number;
  weight: number;
  source?: string;
}) {
  const contribution = (score * weight) / 100;
  const isHighWeight = weight >= 15; // Conversion, Performance, Trust, Content

  const getBarColor = (s: number) => {
    if (s >= 70) return "bg-success";
    if (s >= 50) return "bg-warning";
    return "bg-error";
  };

  // Visual emphasis based on weight - low weight categories are more muted
  const textOpacity = isHighWeight ? "text-foreground" : "text-muted-foreground";
  const barOpacity = isHighWeight ? 1 : 0.5;

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${textOpacity}`}>{name}</span>
          <span className={`text-xs ${isHighWeight ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
            {weight}%
          </span>
        </div>
        <div className="flex items-center gap-3">
          {source && (
            <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              {source}
            </span>
          )}
          <span className={`font-mono text-sm tabular-nums ${textOpacity}`}>
            {score}
            <span className={`text-xs ml-1 ${isHighWeight ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
              → {contribution.toFixed(1)}pts
            </span>
          </span>
        </div>
      </div>
      <div className={`h-2 bg-muted/50 rounded-full overflow-hidden ${!isHighWeight ? "h-1.5" : ""}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${getBarColor(score)}`}
          style={{ width: `${score}%`, opacity: barOpacity }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Data Panel - Collapsible Section
// ============================================================================

function DataPanel({
  title,
  available,
  data,
  icon,
  accentColor = "border-l-muted-foreground",
}: {
  title: string;
  available: boolean;
  data: unknown;
  icon: React.ReactNode;
  accentColor?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`border-l-2 ${
        available ? accentColor : "border-l-muted/30"
      } bg-card/50 rounded-r-lg transition-all`}
    >
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => available && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={available ? "text-foreground" : "text-muted-foreground/50"}>
            {icon}
          </div>
          <span className={`text-sm font-medium ${!available && "text-muted-foreground/50"}`}>
            {title}
          </span>
          <div
            className={`size-1.5 rounded-full ${
              available ? "bg-success" : "bg-muted-foreground/30"
            }`}
          />
        </div>
        <div className="flex items-center gap-2">
          {available && (
            <CopyButton
              value={JSON.stringify(data, null, 2)}
              size="xs"
            />
          )}
          {available && (
            expanded ? (
              <ChevronDown className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 text-muted-foreground" />
            )
          )}
        </div>
      </div>
      {expanded && available && data !== null && data !== undefined ? (
        <div className="px-4 pb-4">
          <JsonBlock data={data} />
        </div>
      ) : null}
    </div>
  );
}

// ============================================================================
// Metric Grid - Key-Value Display
// ============================================================================

function MetricGrid({
  title,
  metrics,
}: {
  title: string;
  metrics: Array<{ label: string; value: string | number | boolean | null; icon?: React.ReactNode }>;
}) {
  const formatValue = (value: string | number | boolean | null) => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") {
      return value ? (
        <CheckCircle2 className="size-4 text-success" />
      ) : (
        <XCircle className="size-4 text-error/50" />
      );
    }
    return value;
  };

  // Create copyable text version
  const copyableText = metrics
    .map((m) => `${m.label}: ${m.value === null ? "null" : m.value}`)
    .join("\n");

  return (
    <div className="bg-card/30 rounded-lg border border-border/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
        <CopyButton value={copyableText} size="xs" />
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {metrics.map((metric, idx) => (
          <div key={idx} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0 group/metric">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              {metric.icon}
              {metric.label}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-mono">{formatValue(metric.value)}</span>
              {typeof metric.value === "string" && metric.value.length > 0 && (
                <CopyButton
                  value={metric.value}
                  size="xs"
                  className="opacity-0 group-hover/metric:opacity-100"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Curl Command Generator
// ============================================================================

function generateCurlCommand(request: RequestInfo): string {
  const parts = ["curl"];

  // Method (only add if not GET)
  if (request.method !== "GET") {
    parts.push(`-X ${request.method}`);
  }

  // Headers
  for (const [key, value] of Object.entries(request.headers)) {
    // Escape single quotes in header values
    const escapedValue = value.replace(/'/g, "'\\''");
    parts.push(`-H '${key}: ${escapedValue}'`);
  }

  // Body (for POST requests)
  if (request.body) {
    // Escape single quotes in body
    const escapedBody = request.body.replace(/'/g, "'\\''");
    parts.push(`-d '${escapedBody}'`);
  }

  // URL (escape single quotes)
  const escapedUrl = request.url.replace(/'/g, "'\\''");
  parts.push(`'${escapedUrl}'`);

  return parts.join(" \\\n  ");
}

function CurlCommand({ request }: { request: RequestInfo }) {
  const curlCmd = generateCurlCommand(request);

  return (
    <div className="bg-background/80 rounded-lg border border-border/50 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            cURL
          </span>
          <Badge variant="outline" className="text-[10px] font-mono">
            {request.method}
          </Badge>
        </div>
        <CopyButton value={curlCmd} />
      </div>
      <Highlight theme={themes.nightOwl} code={curlCmd} language="bash">
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className="text-xs p-3 overflow-x-auto whitespace-pre-wrap break-all"
            style={{ ...style, background: "transparent" }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}

// ============================================================================
// SEMrush CSV Parser - Parses raw CSV data on-the-fly
// ============================================================================

interface SEMrushRawResponse {
  statusCode?: number;
  body?: string;
  domainRanks?: string;
  backlinks?: string;
  organicKeywords?: string;
  refDomains?: string;
}

function parseSEMrushData(response: SEMrushRawResponse): SEMrushParsedData | null {
  if (!response) return null;

  const parseCSV = (csv: string): string[][] => {
    if (!csv || typeof csv !== 'string') return [];
    return csv.trim().split('\n').map(line => line.split(';'));
  };

  let domainRanks: SEMrushParsedData['domainRanks'] = null;
  let backlinks: SEMrushParsedData['backlinks'] = null;
  let topKeywords: SEMrushKeyword[] = [];
  let refDomains: SEMrushRefDomain[] = [];

  // Parse domain_ranks CSV
  // Columns: Database;Domain;Rank;Organic Keywords;Organic Traffic;Organic Cost;Adwords Keywords;Adwords Traffic;Adwords Cost
  if (response.domainRanks) {
    const rows = parseCSV(response.domainRanks);
    if (rows.length >= 2) {
      const data = rows[1]; // Second row is data
      domainRanks = {
        rank: parseInt(data[2]) || 0,           // Column 2: Rank
        organicKeywords: parseInt(data[3]) || 0, // Column 3: Organic Keywords
        organicTraffic: parseInt(data[4]) || 0,  // Column 4: Organic Traffic
        organicCost: parseFloat(data[5]) || 0,   // Column 5: Organic Cost
        adwordsKeywords: parseInt(data[6]) || 0, // Column 6: Adwords Keywords
        adwordsTraffic: parseInt(data[7]) || 0,  // Column 7: Adwords Traffic
        adwordsCost: parseFloat(data[8]) || 0,   // Column 8: Adwords Cost
      };
    }
  }

  // Parse backlinks_overview CSV
  if (response.backlinks) {
    const rows = parseCSV(response.backlinks);
    if (rows.length >= 2) {
      const data = rows[1];
      backlinks = {
        authorityScore: parseInt(data[0]) || 0,
        totalBacklinks: parseInt(data[1]) || 0,
        referringDomains: parseInt(data[2]) || 0,
        referringUrls: parseInt(data[3]) || 0,
        referringIps: parseInt(data[4]) || 0,
        followLinks: parseInt(data[5]) || 0,
        nofollowLinks: parseInt(data[6]) || 0,
      };
    }
  }

  // Parse domain_organic (keywords) CSV
  // Columns: Keyword;Position;Previous Position;Search Volume;CPC;Traffic (%);Traffic Cost;URL
  if (response.organicKeywords) {
    const rows = parseCSV(response.organicKeywords);
    if (rows.length >= 2) {
      // Skip header row
      for (let i = 1; i < rows.length; i++) {
        const data = rows[i];
        if (data.length >= 7) {  // Need at least 7 columns
          topKeywords.push({
            keyword: data[0] || '',
            position: parseInt(data[1]) || 0,
            previousPosition: data[2] ? parseInt(data[2]) : null,
            searchVolume: parseInt(data[3]) || 0,
            cpc: parseFloat(data[4]) || 0,           // Column 4: CPC
            trafficPercent: parseFloat(data[5]) || 0, // Column 5: Traffic %
            traffic: parseFloat(data[6]) || 0,        // Column 6: Traffic Cost (estimated value)
            url: data[7] || '',                       // Column 7: URL
          });
        }
      }
    }
  }

  // Parse backlinks_refdomains CSV
  if (response.refDomains) {
    const rows = parseCSV(response.refDomains);
    if (rows.length >= 2) {
      for (let i = 1; i < rows.length; i++) {
        const data = rows[i];
        if (data.length >= 4) {
          refDomains.push({
            domain: data[0] || '',
            backlinksCount: parseInt(data[1]) || 0,
            firstSeen: data[2] || '',
            lastSeen: data[3] || '',
          });
        }
      }
    }
  }

  // Return null if no data was parsed
  if (!domainRanks && !backlinks && topKeywords.length === 0 && refDomains.length === 0) {
    return null;
  }

  return { domainRanks, backlinks, topKeywords, refDomains };
}

// ============================================================================
// Raw Data Tabs - Tabbed JSON Viewer
// ============================================================================

function RawDataTabs({ rawApiData }: { rawApiData: RawApiData }) {
  const tabs = useMemo(() => {
    const t: Array<{
      id: string;
      label: string;
      available: boolean;
      request?: RequestInfo;
      response: unknown;
      meta: { status?: number | string; size?: string; time?: string };
    }> = [];

    if (rawApiData.htmlFetch?.request && rawApiData.htmlFetch?.response) {
      const resp = rawApiData.htmlFetch.response;
      t.push({
        id: "html",
        label: "HTML",
        available: true,
        request: rawApiData.htmlFetch.request,
        response: resp,
        meta: {
          status: resp.statusCode,
          size: `${(resp.contentLength / 1024).toFixed(1)}KB`,
          time: `${resp.loadTimeMs}ms`,
        },
      });
    }
    if (rawApiData.pageSpeed?.request && rawApiData.pageSpeed?.response) {
      const ps = rawApiData.pageSpeed.response as { lighthouseResult?: unknown; error?: unknown } | null;
      t.push({
        id: "pagespeed",
        label: "PageSpeed",
        available: !!ps?.lighthouseResult,
        request: rawApiData.pageSpeed.request,
        response: rawApiData.pageSpeed.response,
        meta: ps?.lighthouseResult ? { status: 200 } : { status: "Error" },
      });
    }
    if (rawApiData.dataForSEO?.request && rawApiData.dataForSEO?.response) {
      const d = rawApiData.dataForSEO.response as { status_code?: number } | null;
      t.push({
        id: "dataforseo",
        label: "DataForSEO",
        available: d?.status_code === 20000,
        request: rawApiData.dataForSEO.request,
        response: rawApiData.dataForSEO.response,
        meta: { status: d?.status_code || "N/A" },
      });
    }
    if (rawApiData.semrush?.request && rawApiData.semrush?.response) {
      const sr = rawApiData.semrush.response as {
        statusCode?: number;
        body?: string;
        domainRanks?: string;
        backlinks?: string;
      } | null;
      // Check for either old format (body) or new format (domainRanks/backlinks)
      const hasData = !!(sr?.body || sr?.domainRanks || sr?.backlinks);
      t.push({
        id: "semrush",
        label: "SEMrush",
        available: hasData,
        request: rawApiData.semrush.request,
        response: rawApiData.semrush.response,
        meta: { status: sr?.statusCode || "N/A" },
      });
    }
    return t;
  }, [rawApiData]);

  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "html");
  const [copied, setCopied] = useState(false);

  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  const copyData = async () => {
    if (!currentTab?.response) return;
    await navigator.clipboard.writeText(JSON.stringify(currentTab.response, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (tabs.length === 0) return null;

  return (
    <div className="bg-card/30 rounded-lg border border-border/50 overflow-hidden">
      {/* Tab strip */}
      <div className="flex items-center justify-between border-b border-border/50 px-2">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`size-1.5 rounded-full ${
                    tab.available ? "bg-success" : "bg-muted-foreground/30"
                  }`}
                />
                {tab.label}
              </div>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 pr-2">
          {currentTab?.meta && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {currentTab.meta.status && (
                <span className="font-mono">Status: {currentTab.meta.status}</span>
              )}
              {currentTab.meta.size && (
                <span className="font-mono">Size: {currentTab.meta.size}</span>
              )}
              {currentTab.meta.time && (
                <span className="font-mono">Time: {currentTab.meta.time}</span>
              )}
            </div>
          )}
          <Button variant="ghost" size="sm" className="h-7" onClick={copyData}>
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          </Button>
        </div>
      </div>

      {/* Tab content */}
      <div className="p-4 space-y-4">
        {/* Curl Command */}
        {currentTab?.request && (
          <CurlCommand request={currentTab.request} />
        )}

        {currentTab?.response !== undefined && (
          <JsonBlock data={currentTab.response} maxHeight="max-h-[400px]" label="Response" />
        )}

        {activeTab === "semrush" && rawApiData.semrush?.response ? (
          <SEMrushFormattedView response={rawApiData.semrush.response as SEMrushRawResponse} />
        ) : null}
      </div>
    </div>
  );
}

// ============================================================================
// SEMrush Formatted View (for RawDataTabs)
// ============================================================================

function SEMrushFormattedView({ response }: { response: SEMrushRawResponse }) {
  // Parse on-the-fly
  const parsed = useMemo(() => parseSEMrushData(response), [response]);

  if (!parsed) return null;

  const { domainRanks, backlinks, topKeywords, refDomains } = parsed;

  const formatNum = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          Formatted SEMrush Data
        </h3>
        <Badge variant="secondary" className="text-[10px]">Parsed from CSV</Badge>
      </div>

      {/* Domain Overview */}
      {(domainRanks || backlinks) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {domainRanks && (
            <>
              <div className="bg-muted/30 rounded-lg p-3 border border-border/30">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Domain Rank</div>
                <div className="text-lg font-mono font-bold">#{formatNum(domainRanks.rank)}</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 border border-border/30">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Organic KWs</div>
                <div className="text-lg font-mono font-bold text-success">{formatNum(domainRanks.organicKeywords)}</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 border border-border/30">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Organic Traffic</div>
                <div className="text-lg font-mono font-bold">{formatNum(domainRanks.organicTraffic)}</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 border border-border/30">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Traffic Value</div>
                <div className="text-lg font-mono font-bold text-warning">${formatNum(domainRanks.organicCost)}</div>
              </div>
            </>
          )}
          {backlinks && (
            <>
              <div className="bg-muted/30 rounded-lg p-3 border border-border/30">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Authority</div>
                <div className="text-lg font-mono font-bold text-primary">{backlinks.authorityScore}</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 border border-border/30">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Backlinks</div>
                <div className="text-lg font-mono font-bold">{formatNum(backlinks.totalBacklinks)}</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Top Keywords Table */}
      {topKeywords.length > 0 && (
        <div className="bg-muted/20 rounded-lg border border-border/30 overflow-hidden">
          <div className="px-3 py-2 border-b border-border/30 flex items-center justify-between bg-muted/30">
            <span className="text-xs font-medium">Top Keywords</span>
            <Badge variant="secondary" className="text-[10px]">{topKeywords.length}</Badge>
          </div>
          <div className="overflow-x-auto max-h-[200px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/20 sticky top-0">
                <tr className="text-muted-foreground">
                  <th className="text-left px-3 py-1.5 font-medium">Keyword</th>
                  <th className="text-center px-2 py-1.5 font-medium">Pos</th>
                  <th className="text-right px-2 py-1.5 font-medium">Volume</th>
                  <th className="text-right px-2 py-1.5 font-medium">Traffic</th>
                  <th className="text-right px-3 py-1.5 font-medium">CPC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {topKeywords.slice(0, 10).map((kw, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="px-3 py-1.5 font-medium truncate max-w-[150px]" title={kw.keyword}>{kw.keyword}</td>
                    <td className="text-center px-2 py-1.5">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono ${
                        kw.position <= 3 ? "bg-success/20 text-success" :
                        kw.position <= 10 ? "bg-warning/20 text-warning" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {kw.position}
                      </span>
                    </td>
                    <td className="text-right px-2 py-1.5 font-mono text-muted-foreground">{formatNum(kw.searchVolume)}</td>
                    <td className="text-right px-2 py-1.5 font-mono">{kw.traffic.toFixed(0)}</td>
                    <td className="text-right px-3 py-1.5 font-mono text-muted-foreground">${kw.cpc.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Referring Domains */}
      {refDomains.length > 0 && (
        <div className="bg-muted/20 rounded-lg border border-border/30 overflow-hidden">
          <div className="px-3 py-2 border-b border-border/30 flex items-center justify-between bg-muted/30">
            <span className="text-xs font-medium">Top Referring Domains</span>
            <Badge variant="secondary" className="text-[10px]">{refDomains.length}</Badge>
          </div>
          <div className="overflow-x-auto max-h-[150px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/20 sticky top-0">
                <tr className="text-muted-foreground">
                  <th className="text-left px-3 py-1.5 font-medium">Domain</th>
                  <th className="text-right px-2 py-1.5 font-medium">Backlinks</th>
                  <th className="text-right px-3 py-1.5 font-medium">First Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {refDomains.slice(0, 10).map((rd, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="px-3 py-1.5 font-medium">{rd.domain}</td>
                    <td className="text-right px-2 py-1.5 font-mono">{formatNum(rd.backlinksCount)}</td>
                    <td className="text-right px-3 py-1.5 text-muted-foreground">{rd.firstSeen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Backlink Breakdown */}
      {backlinks && (
        <div className="bg-muted/20 rounded-lg border border-border/30 p-3">
          <div className="text-xs font-medium mb-2">Backlink Profile</div>
          <div className="grid grid-cols-5 gap-2 text-center">
            <div>
              <div className="text-sm font-mono font-bold">{formatNum(backlinks.referringDomains)}</div>
              <div className="text-[10px] text-muted-foreground">Ref Domains</div>
            </div>
            <div>
              <div className="text-sm font-mono font-bold">{formatNum(backlinks.referringUrls)}</div>
              <div className="text-[10px] text-muted-foreground">Ref URLs</div>
            </div>
            <div>
              <div className="text-sm font-mono font-bold">{formatNum(backlinks.referringIps)}</div>
              <div className="text-[10px] text-muted-foreground">Ref IPs</div>
            </div>
            <div>
              <div className="text-sm font-mono font-bold text-success">{formatNum(backlinks.followLinks)}</div>
              <div className="text-[10px] text-muted-foreground">Follow</div>
            </div>
            <div>
              <div className="text-sm font-mono font-bold text-muted-foreground">{formatNum(backlinks.nofollowLinks)}</div>
              <div className="text-[10px] text-muted-foreground">Nofollow</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SEO Metrics Comparison - DataForSEO vs SEMrush
// ============================================================================

interface SEOMetrics {
  organic_keywords?: number;
  organic_traffic?: number;
  authority_score?: number;
  domain_rank?: number;
  backlinks?: number;
  source?: string;
}

function SEOMetricsComparison({ result }: { result: AuditResult }) {
  // Access extended fields that may exist on the result
  const extendedResult = result as AuditResult & {
    dataForSEOMetrics?: SEOMetrics;
    semrushMetrics?: SEOMetrics;
  };

  const dataForSEO = extendedResult.dataForSEOMetrics;
  const semrush = extendedResult.semrushMetrics;

  if (!dataForSEO && !semrush) return null;

  return (
    <div>
      <h2 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <Activity className="size-4" />
        SEO Metrics Comparison
      </h2>
      <div className="grid md:grid-cols-2 gap-6">
        {/* DataForSEO */}
        {dataForSEO && (
          <MetricGrid
            title="DataForSEO"
            metrics={[
              { label: "Organic Keywords", value: dataForSEO.organic_keywords?.toLocaleString() ?? "—" },
              { label: "Organic Traffic", value: dataForSEO.organic_traffic?.toLocaleString() ?? "—" },
              { label: "Authority Score", value: dataForSEO.authority_score ?? "—" },
              { label: "Top Keywords (Pos 1)", value: dataForSEO.domain_rank ?? "—" },
              { label: "Backlinks", value: dataForSEO.backlinks?.toLocaleString() ?? "—" },
            ]}
          />
        )}

        {/* SEMrush */}
        {semrush && (
          <MetricGrid
            title="SEMrush"
            metrics={[
              { label: "Organic Keywords", value: semrush.organic_keywords?.toLocaleString() ?? "—" },
              { label: "Organic Traffic", value: semrush.organic_traffic?.toLocaleString() ?? "—" },
              { label: "Authority Score", value: semrush.authority_score ?? "—" },
              { label: "Domain Rank", value: semrush.domain_rank ? `#${semrush.domain_rank.toLocaleString()}` : "—" },
              { label: "Backlinks", value: semrush.backlinks?.toLocaleString() ?? "—" },
            ]}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SEMrush Dashboard - Full Presentation Layer
// ============================================================================

function SEMrushDashboard({ rawApiData }: { rawApiData: RawApiData }) {
  // Parse on-the-fly from raw response
  const semrushData = useMemo(() => {
    if (!rawApiData.semrush?.response) return null;
    return parseSEMrushData(rawApiData.semrush.response as SEMrushRawResponse);
  }, [rawApiData.semrush?.response]);

  if (!semrushData) return null;

  const { domainRanks, backlinks, topKeywords, refDomains } = semrushData;

  // No data at all
  if (!domainRanks && !backlinks && topKeywords.length === 0 && refDomains.length === 0) {
    return null;
  }

  // Format large numbers
  const formatNum = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  // Format currency
  const formatCurrency = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
    return `$${n.toFixed(0)}`;
  };

  // Position change indicator
  const PositionChange = ({ current, previous }: { current: number; previous: number | null }) => {
    if (previous === null) return <span className="text-muted-foreground text-[10px]">NEW</span>;
    const diff = previous - current;
    if (diff === 0) return <span className="text-muted-foreground">—</span>;
    return (
      <span className={`text-xs font-medium ${diff > 0 ? "text-success" : "text-error"}`}>
        {diff > 0 ? "↑" : "↓"}{Math.abs(diff)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <Activity className="size-4" />
        SEMrush Intelligence
      </h2>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Domain Rank */}
        {domainRanks && (
          <>
            <div className="bg-card/50 rounded-lg border border-border/50 p-4">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Domain Rank</div>
              <div className="text-2xl font-mono font-bold">
                #{formatNum(domainRanks.rank)}
              </div>
            </div>
            <div className="bg-card/50 rounded-lg border border-border/50 p-4">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Organic Keywords</div>
              <div className="text-2xl font-mono font-bold text-success">
                {formatNum(domainRanks.organicKeywords)}
              </div>
            </div>
            <div className="bg-card/50 rounded-lg border border-border/50 p-4">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Organic Traffic</div>
              <div className="text-2xl font-mono font-bold">
                {formatNum(domainRanks.organicTraffic)}
              </div>
              <div className="text-xs text-muted-foreground">monthly visits</div>
            </div>
            <div className="bg-card/50 rounded-lg border border-border/50 p-4">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Traffic Value</div>
              <div className="text-2xl font-mono font-bold text-warning">
                {formatCurrency(domainRanks.organicCost)}
              </div>
              <div className="text-xs text-muted-foreground">/month</div>
            </div>
          </>
        )}

        {/* Backlinks */}
        {backlinks && (
          <>
            <div className="bg-card/50 rounded-lg border border-border/50 p-4">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Authority Score</div>
              <div className="text-2xl font-mono font-bold text-primary">
                {backlinks.authorityScore}
              </div>
              <div className="text-xs text-muted-foreground">/100</div>
            </div>
            <div className="bg-card/50 rounded-lg border border-border/50 p-4">
              <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Backlinks</div>
              <div className="text-2xl font-mono font-bold">
                {formatNum(backlinks.totalBacklinks)}
              </div>
              <div className="text-xs text-muted-foreground">
                from {formatNum(backlinks.referringDomains)} domains
              </div>
            </div>
          </>
        )}
      </div>

      {/* Backlink Breakdown */}
      {backlinks && (
        <div className="bg-card/30 rounded-lg border border-border/50 p-4">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Shield className="size-4 text-primary" />
            Backlink Profile
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <div className="text-lg font-mono font-bold">{formatNum(backlinks.referringDomains)}</div>
              <div className="text-xs text-muted-foreground">Ref. Domains</div>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <div className="text-lg font-mono font-bold">{formatNum(backlinks.referringUrls)}</div>
              <div className="text-xs text-muted-foreground">Ref. URLs</div>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <div className="text-lg font-mono font-bold">{formatNum(backlinks.referringIps)}</div>
              <div className="text-xs text-muted-foreground">Ref. IPs</div>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <div className="text-lg font-mono font-bold text-success">{formatNum(backlinks.followLinks)}</div>
              <div className="text-xs text-muted-foreground">Follow</div>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <div className="text-lg font-mono font-bold text-muted-foreground">{formatNum(backlinks.nofollowLinks)}</div>
              <div className="text-xs text-muted-foreground">Nofollow</div>
            </div>
          </div>
          {/* Follow/Nofollow bar */}
          <div className="mt-4">
            <div className="h-2 bg-muted rounded-full overflow-hidden flex">
              <div
                className="bg-success h-full transition-all"
                style={{
                  width: `${(backlinks.followLinks / (backlinks.followLinks + backlinks.nofollowLinks)) * 100}%`
                }}
              />
              <div
                className="bg-muted-foreground/30 h-full transition-all"
                style={{
                  width: `${(backlinks.nofollowLinks / (backlinks.followLinks + backlinks.nofollowLinks)) * 100}%`
                }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>Follow: {((backlinks.followLinks / (backlinks.followLinks + backlinks.nofollowLinks)) * 100).toFixed(1)}%</span>
              <span>Nofollow: {((backlinks.nofollowLinks / (backlinks.followLinks + backlinks.nofollowLinks)) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Keywords Table */}
      {topKeywords.length > 0 && (
        <div className="bg-card/30 rounded-lg border border-border/50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Activity className="size-4 text-success" />
              Top Ranking Keywords
              <Badge variant="secondary" className="text-[10px]">{topKeywords.length}</Badge>
            </h3>
            <CopyButton
              value={topKeywords.map(k => `${k.keyword}\t${k.position}\t${k.searchVolume}\t${k.traffic}`).join('\n')}
              size="xs"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/20">
                <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="text-left px-4 py-2 font-medium">Keyword</th>
                  <th className="text-center px-2 py-2 font-medium">Pos</th>
                  <th className="text-center px-2 py-2 font-medium">Chg</th>
                  <th className="text-right px-2 py-2 font-medium">Volume</th>
                  <th className="text-right px-2 py-2 font-medium">Traffic</th>
                  <th className="text-right px-2 py-2 font-medium">%</th>
                  <th className="text-right px-4 py-2 font-medium">CPC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {topKeywords.map((kw, idx) => (
                  <tr key={idx} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="font-medium truncate max-w-[200px]" title={kw.keyword}>
                        {kw.keyword}
                      </div>
                      {kw.url && (
                        <div className="text-[10px] text-muted-foreground truncate max-w-[200px]" title={kw.url}>
                          {new URL(kw.url).pathname}
                        </div>
                      )}
                    </td>
                    <td className="text-center px-2 py-2.5">
                      <Badge
                        variant={kw.position <= 3 ? "success" : kw.position <= 10 ? "warning" : "secondary"}
                        className="font-mono text-xs"
                      >
                        {kw.position}
                      </Badge>
                    </td>
                    <td className="text-center px-2 py-2.5">
                      <PositionChange current={kw.position} previous={kw.previousPosition} />
                    </td>
                    <td className="text-right px-2 py-2.5 font-mono text-muted-foreground">
                      {formatNum(kw.searchVolume)}
                    </td>
                    <td className="text-right px-2 py-2.5 font-mono font-medium">
                      {kw.traffic.toFixed(0)}
                    </td>
                    <td className="text-right px-2 py-2.5 font-mono text-xs text-muted-foreground">
                      {kw.trafficPercent.toFixed(1)}%
                    </td>
                    <td className="text-right px-4 py-2.5 font-mono text-xs text-muted-foreground">
                      ${kw.cpc.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Referring Domains Table */}
      {refDomains.length > 0 && (
        <div className="bg-card/30 rounded-lg border border-border/50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Globe className="size-4 text-primary" />
              Top Referring Domains
              <Badge variant="secondary" className="text-[10px]">{refDomains.length}</Badge>
            </h3>
            <CopyButton
              value={refDomains.map(d => `${d.domain}\t${d.backlinksCount}`).join('\n')}
              size="xs"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/20">
                <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="text-left px-4 py-2 font-medium">Domain</th>
                  <th className="text-right px-2 py-2 font-medium">Backlinks</th>
                  <th className="text-right px-2 py-2 font-medium">First Seen</th>
                  <th className="text-right px-4 py-2 font-medium">Last Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {refDomains.map((rd, idx) => (
                  <tr key={idx} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5">
                      <a
                        href={`https://${rd.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:text-primary flex items-center gap-1 group"
                      >
                        {rd.domain}
                        <ExternalLink className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </td>
                    <td className="text-right px-2 py-2.5 font-mono">
                      {formatNum(rd.backlinksCount)}
                    </td>
                    <td className="text-right px-2 py-2.5 text-xs text-muted-foreground">
                      {rd.firstSeen}
                    </td>
                    <td className="text-right px-4 py-2.5 text-xs text-muted-foreground">
                      {rd.lastSeen}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paid Search (if available) */}
      {domainRanks && domainRanks.adwordsKeywords > 0 && (
        <div className="bg-card/30 rounded-lg border border-border/50 p-4">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Gauge className="size-4 text-warning" />
            Paid Search Activity
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <div className="text-lg font-mono font-bold">{formatNum(domainRanks.adwordsKeywords)}</div>
              <div className="text-xs text-muted-foreground">Paid Keywords</div>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <div className="text-lg font-mono font-bold">{formatNum(domainRanks.adwordsTraffic)}</div>
              <div className="text-xs text-muted-foreground">Paid Traffic</div>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <div className="text-lg font-mono font-bold text-warning">{formatCurrency(domainRanks.adwordsCost)}</div>
              <div className="text-xs text-muted-foreground">Ad Spend/mo</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Recommendations Preview - Top Issues Summary
// ============================================================================

function RecommendationsPreview({
  recommendations,
  onViewAll,
}: {
  recommendations: AuditResult["recommendations"];
  onViewAll: () => void;
}) {
  // Get top 5 actionable items (fails first, then warnings, sorted by impact)
  const prioritized = [...recommendations]
    .filter((r) => r.status !== "pass")
    .sort((a, b) => {
      // Sort by status (fail > warning) then by impact (High > Medium > Low)
      const statusOrder = { fail: 0, warning: 1, pass: 2 };
      const impactOrder = { High: 0, Medium: 1, Low: 2 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      return impactOrder[a.impact] - impactOrder[b.impact];
    })
    .slice(0, 5);

  const stats = {
    pass: recommendations.filter((r) => r.status === "pass").length,
    fail: recommendations.filter((r) => r.status === "fail").length,
    warning: recommendations.filter((r) => r.status === "warning").length,
  };

  if (prioritized.length === 0) {
    return (
      <div className="bg-success/10 border border-success/30 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-success" />
          <span className="font-medium">All checks passed!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card/30 rounded-lg border border-border/50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="size-4" />
          Top Issues to Address
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-error">
              <XCircle className="size-3" /> {stats.fail}
            </span>
            <span className="flex items-center gap-1 text-warning">
              <AlertTriangle className="size-3" /> {stats.warning}
            </span>
            <span className="flex items-center gap-1 text-success">
              <CheckCircle2 className="size-3" /> {stats.pass}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={onViewAll} className="text-xs">
            View all →
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {prioritized.map((rec, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/30"
          >
            {rec.status === "fail" ? (
              <XCircle className="size-4 text-error shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="size-4 text-warning shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{rec.title}</span>
                <Badge
                  variant={
                    rec.impact === "High" ? "error" : rec.impact === "Medium" ? "warning" : "secondary"
                  }
                  className="text-[10px] px-1.5 py-0"
                >
                  {rec.impact}
                </Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {rec.category}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{rec.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Recommendations Section - Full List
// ============================================================================

function RecommendationsGrid({
  recommendations,
}: {
  recommendations: AuditResult["recommendations"];
}) {
  const byCategory = recommendations.reduce(
    (acc, rec) => {
      if (!acc[rec.category]) acc[rec.category] = [];
      acc[rec.category].push(rec);
      return acc;
    },
    {} as Record<string, typeof recommendations>
  );

  const stats = {
    pass: recommendations.filter((r) => r.status === "pass").length,
    fail: recommendations.filter((r) => r.status === "fail").length,
    warning: recommendations.filter((r) => r.status === "warning").length,
  };

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-success">
          <CheckCircle2 className="size-3" />
          {stats.pass} pass
        </span>
        <span className="flex items-center gap-1.5 text-warning">
          <AlertTriangle className="size-3" />
          {stats.warning} warning
        </span>
        <span className="flex items-center gap-1.5 text-error">
          <XCircle className="size-3" />
          {stats.fail} fail
        </span>
      </div>

      {/* Category groups */}
      <div className="grid gap-4">
        {Object.entries(byCategory).map(([category, recs]) => (
          <div key={category} className="bg-card/30 rounded-lg border border-border/50 p-4">
            <h4 className="text-sm font-medium mb-3">{category}</h4>
            <div className="space-y-2">
              {recs.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-xs p-2 rounded bg-background/30"
                >
                  {rec.status === "pass" ? (
                    <CheckCircle2 className="size-3 text-success shrink-0 mt-0.5" />
                  ) : rec.status === "fail" ? (
                    <XCircle className="size-3 text-error shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="size-3 text-warning shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rec.title}</span>
                      <Badge
                        variant={
                          rec.impact === "High"
                            ? "error"
                            : rec.impact === "Medium"
                            ? "warning"
                            : "secondary"
                        }
                        className="text-[10px] px-1.5 py-0"
                      >
                        {rec.impact}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-0.5">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function AdminAuditDetailPage() {
  const params = useParams();
  const auditId = params.auditId as string;
  const [audit, setAudit] = useState<StoredAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [recalculateResult, setRecalculateResult] = useState<{
    oldScore: number;
    newScore: number;
    newAuditId: string;
    changes: { name: string; oldScore: number; newScore: number; diff: number }[];
  } | null>(null);

  useEffect(() => {
    async function loadAuditData() {
      try {
        const res = await fetch(`/api/audit/${auditId}`);
        if (!res.ok) {
          throw new Error("Audit not found");
        }
        const data = await res.json();
        setAudit(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load audit");
      } finally {
        setLoading(false);
      }
    }
    loadAuditData();
  }, [auditId]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    setRecalculateResult(null);
    try {
      const res = await fetch("/api/audit/recalculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId }),
      });
      const data = await res.json();
      if (data.success) {
        setRecalculateResult(data);
      } else {
        setError(data.error || "Recalculation failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recalculation failed");
    } finally {
      setRecalculating(false);
    }
  };

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Track active section for navigation highlighting - must be before early returns
  const sectionIds = NAV_SECTIONS.map((s) => s.id);
  const activeSection = useActiveSection(sectionIds);
  const activeSectionData = NAV_SECTIONS.find((s) => s.id === activeSection);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading audit data...</span>
        </div>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-lg p-8 text-center max-w-md">
          <XCircle className="size-12 text-error mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Audit Not Found</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="size-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const result = audit.result;
  const meta = result.meta;
  const dataSources = (meta?.dataSourcesUsed || {}) as Record<string, boolean>;
  const rawApiData = (result as unknown as { rawApiData?: RawApiData }).rawApiData || {};

  return (
    <div className="min-h-screen bg-background">
      {/* ================================================================== */}
      {/* Hero Header */}
      {/* ================================================================== */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="size-4" />
              </Button>
              <div className="h-6 w-px bg-border/50" />
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold tracking-tight">{audit.domain}</h1>
                <Badge variant="outline" className="font-mono text-[10px] px-2">
                  {audit.id.slice(0, 8)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(audit.completedAt)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRecalculate}
                disabled={recalculating}
                className="text-muted-foreground"
              >
                <RefreshCw className={`size-4 ${recalculating ? "animate-spin" : ""}`} />
                {recalculating ? "Recalculating..." : "Recalculate"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/report/${audit.id}`, "_blank")}
              >
                <ExternalLink className="size-4" />
                View Report
              </Button>

              {/* Theme Picker */}
              <ThemePicker />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* ================================================================== */}
          {/* Left Sidebar - Section Navigation */}
          {/* ================================================================== */}
          <aside className="hidden lg:block w-44 shrink-0">
            <nav className="sticky top-24 space-y-0.5">
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">
                Sections
              </div>
              {NAV_SECTIONS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" })}
                    className={`
                      block w-full text-left px-3 py-1.5 text-xs rounded-md transition-all
                      ${isActive
                        ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }
                    `}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* ================================================================== */}
          {/* Main Content */}
          {/* ================================================================== */}
          <main className="flex-1 min-w-0 space-y-8">
            {/* ================================================================== */}
            {/* Score + Status Section */}
            {/* ================================================================== */}
            <div id="overview" className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Score Ring with Metadata */}
              <div className="flex flex-col items-center lg:items-start gap-4">
                <ScoreRing score={result.overallScore} projectedScore={result.projectedScore} />

                {/* Audit Metadata */}
                <div className="text-center lg:text-left space-y-1 max-w-[180px]">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{audit.domain}</span>
                  </div>
                  {meta?.url && (
                    <div className="text-[10px] text-muted-foreground truncate" title={meta.url}>
                      {meta.url}
                    </div>
                  )}
                  <div className="flex items-center justify-center lg:justify-start gap-3 text-[10px] text-muted-foreground">
                    {meta?.fetchTimeMs && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {(meta.fetchTimeMs / 1000).toFixed(1)}s
                      </span>
                    )}
                    <span>{formatRelativeTime(audit.completedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Right side content */}
              <div className="flex-1 space-y-6">
                {/* Status Bar */}
                <StatusBar dataSources={dataSources} />

                {/* Category Breakdown */}
                <div className="space-y-3">
                  {result.categories.map((cat) => (
                    <CategoryBar
                      key={cat.name}
                      name={cat.name}
                      score={cat.score}
                      weight={cat.weight}
                      source={cat.source}
                    />
                  ))}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <span className="text-sm font-medium">Weighted Total</span>
                    <span className="font-mono text-lg tabular-nums">
                      {result.categories
                        .reduce((sum, cat) => sum + (cat.score * cat.weight) / 100, 0)
                        .toFixed(0)}
                      <span className="text-muted-foreground text-sm">/100</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

        {/* ================================================================== */}
        {/* Recalculate Result */}
        {/* ================================================================== */}
        {recalculateResult && (
          <div className="border border-success/30 bg-success/5 rounded-lg p-6">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <CheckCircle2 className="size-4 text-success" />
              Scores Recalculated
            </h3>
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-sm text-muted-foreground">Old Score</div>
                <div className="text-2xl font-mono">{recalculateResult.oldScore}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">New Score</div>
                <div className="text-2xl font-mono text-success">
                  {recalculateResult.newScore}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Difference</div>
                <div
                  className={`text-2xl font-mono ${
                    recalculateResult.newScore > recalculateResult.oldScore
                      ? "text-success"
                      : recalculateResult.newScore < recalculateResult.oldScore
                      ? "text-error"
                      : ""
                  }`}
                >
                  {recalculateResult.newScore - recalculateResult.oldScore >= 0 ? "+" : ""}
                  {recalculateResult.newScore - recalculateResult.oldScore}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => (window.location.href = `/admin/${recalculateResult.newAuditId}`)}
            >
              View New Audit
            </Button>
          </div>
        )}

        {/* ================================================================== */}
        {/* Notes/Warnings - Only show actual warnings, not informational notes */}
        {/* ================================================================== */}
        {meta?.notes && meta.notes.filter(n => n.includes("unavailable") || n.includes("error") || n.includes("missing")).length > 0 && (
          <div className="border border-warning/30 bg-warning/5 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-4 text-warning shrink-0 mt-0.5" />
              <div className="space-y-1">
                {meta.notes.filter(n => n.includes("unavailable") || n.includes("error") || n.includes("missing")).map((note, idx) => (
                  <p key={idx} className="text-sm text-muted-foreground">
                    {note}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* Recommendations Preview - Top issues at a glance */}
        {/* ================================================================== */}
        <div id="recommendations-preview">
        <RecommendationsPreview
          recommendations={result.recommendations}
          onViewAll={() => document.getElementById("recommendations-section")?.scrollIntoView({ behavior: "smooth" })}
        />
        </div>

        {/* ================================================================== */}
        {/* Booking Flow & Trust Signals - Moved Up */}
        {/* ================================================================== */}
        <div id="booking-trust-section" className="grid md:grid-cols-2 gap-6">
          {/* Booking Flow */}
          {result.bookingFlow && (
            <MetricGrid
              title="Booking Flow"
              metrics={[
                { label: "Booking CTA", value: result.bookingFlow.hasBookingCTA },
                { label: "CTA Text", value: result.bookingFlow.ctaText },
                { label: "CTA Location", value: result.bookingFlow.ctaLocation },
                {
                  label: "Booking Engine",
                  value: result.bookingFlow.bookingEngine?.name || "None",
                },
                { label: "Date Picker", value: result.bookingFlow.hasDatePicker },
                { label: "Instant Book", value: result.bookingFlow.hasInstantBook },
                { label: "Clicks to Book", value: result.bookingFlow.estimatedClicksToBook },
                { label: "Friction Score", value: result.bookingFlow.frictionScore },
              ]}
            />
          )}

          {/* Trust Signals */}
          {result.trustSignals && (
            <MetricGrid
              title="Trust Signals"
              metrics={[
                { label: "Trust Score", value: result.trustSignals.overallTrustScore },
                { label: "Has Reviews", value: result.trustSignals.hasReviews },
                {
                  label: "Review Source",
                  value: result.trustSignals.reviewSource?.name || "None",
                },
                { label: "Review Count", value: result.trustSignals.reviewCount },
                { label: "Avg Rating", value: result.trustSignals.averageRating },
                { label: "Phone Number", value: result.trustSignals.hasPhoneNumber },
                { label: "Email", value: result.trustSignals.hasEmailAddress },
                { label: "Privacy Policy", value: result.trustSignals.hasPrivacyPolicy },
              ]}
            />
          )}
        </div>

        {/* ================================================================== */}
        {/* SEO Metrics Comparison - DataForSEO vs SEMrush */}
        {/* ================================================================== */}
        <div id="seo-section">
          <SEOMetricsComparison result={result} />
        </div>

        {/* ================================================================== */}
        {/* SEMrush Full Dashboard */}
        {/* ================================================================== */}
        <div id="semrush-section">
          <SEMrushDashboard rawApiData={rawApiData} />
        </div>

        {/* ================================================================== */}
        {/* Revenue Impact */}
        {/* ================================================================== */}
        <div id="revenue-section" className="bg-card/30 rounded-lg border border-border/50 p-6">
          <h3 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Activity className="size-4" />
            Revenue Impact Analysis
          </h3>
          <div className="grid sm:grid-cols-4 gap-6">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Current Score</div>
              <div className="text-2xl font-mono">{result.overallScore}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Target Score</div>
              <div className="text-2xl font-mono">90</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Score Gap</div>
              <div className="text-2xl font-mono">{Math.max(0, 90 - result.overallScore)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Est. Monthly Loss</div>
              <div className="text-2xl font-mono text-error">
                ${result.monthlyRevenueLoss.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* Data Panels */}
        {/* ================================================================== */}
        <div id="data-sources-section">
          <h2 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Database className="size-4" />
            Data Sources
          </h2>
          <div className="space-y-2">
            <DataPanel
              title="Core Web Vitals"
              available={!!result.coreWebVitals}
              data={result.coreWebVitals}
              icon={<Gauge className="size-4" />}
              accentColor="border-l-success"
            />
            <DataPanel
              title="Lighthouse Scores"
              available={!!result.lighthouseScores}
              data={result.lighthouseScores}
              icon={<Server className="size-4" />}
              accentColor="border-l-primary"
            />
            <DataPanel
              title="SEO Metrics"
              available={!!result.seoMetrics}
              data={result.seoMetrics}
              icon={<Activity className="size-4" />}
              accentColor="border-l-warning"
            />
            <DataPanel
              title="Booking Flow Analysis"
              available={!!result.bookingFlow}
              data={result.bookingFlow}
              icon={<FileCode className="size-4" />}
              accentColor="border-l-chart-4"
            />
            <DataPanel
              title="Trust Signal Analysis"
              available={!!result.trustSignals}
              data={result.trustSignals}
              icon={<Shield className="size-4" />}
              accentColor="border-l-chart-5"
            />
          </div>
        </div>

        {/* ================================================================== */}
        {/* Recommendations - Full List */}
        {/* ================================================================== */}
        <div id="recommendations-section">
          <h2 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="size-4" />
            All Recommendations
          </h2>
          <RecommendationsGrid recommendations={result.recommendations} />
        </div>

        {/* ================================================================== */}
        {/* Raw API Responses - Tabbed Interface */}
        {/* ================================================================== */}
        {Object.keys(rawApiData).length > 0 && (
          <div id="raw-api-section">
            <h2 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Server className="size-4" />
              Raw API Responses
            </h2>
            <RawDataTabs rawApiData={rawApiData} />
          </div>
        )}

        {/* ================================================================== */}
        {/* Full Raw Result */}
        {/* ================================================================== */}
        <div id="full-result-section">
          <h2 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <FileCode className="size-4" />
            Full Audit Result
          </h2>
          <DataPanel
            title="Complete JSON Response"
            available={true}
            data={result}
            icon={<Database className="size-4" />}
            accentColor="border-l-muted-foreground"
          />
        </div>
          </main>

          {/* ================================================================== */}
          {/* Right Sidebar - Current Section Details */}
          {/* ================================================================== */}
          <aside className="hidden xl:block w-52 shrink-0">
            <div className="sticky top-24 space-y-4">
              {/* Current Section Indicator */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Current Section
                </div>
                <div className="text-sm font-medium text-foreground">
                  {activeSectionData?.label || "Overview"}
                </div>
              </div>

              {/* Section Components */}
              {activeSectionData?.subsections && activeSectionData.subsections.length > 0 && (
                <div className="p-3 rounded-lg bg-card/50 border border-border/50">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Components
                  </div>
                  <ul className="space-y-1">
                    {activeSectionData.subsections.map((sub, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="size-1 rounded-full bg-muted-foreground/50" />
                        {sub}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quick Stats for Overview */}
              {activeSection === "overview" && (
                <div className="p-3 rounded-lg bg-card/50 border border-border/50">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Quick Stats
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Score</span>
                      <span className="font-mono font-medium">{result.overallScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Categories</span>
                      <span className="font-mono">{result.categories.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Issues</span>
                      <span className="font-mono text-error">
                        {result.recommendations.filter((r) => r.status === "fail").length}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations Stats */}
              {(activeSection === "recommendations-preview" || activeSection === "recommendations-section") && (
                <div className="p-3 rounded-lg bg-card/50 border border-border/50">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Summary
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-error">Failed</span>
                      <span className="font-mono">{result.recommendations.filter((r) => r.status === "fail").length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-warning">Warnings</span>
                      <span className="font-mono">{result.recommendations.filter((r) => r.status === "warning").length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-success">Passed</span>
                      <span className="font-mono">{result.recommendations.filter((r) => r.status === "pass").length}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Sources Stats */}
              {activeSection === "data-sources-section" && (
                <div className="p-3 rounded-lg bg-card/50 border border-border/50">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Status
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {Object.entries(dataSources).map(([key, active]) => (
                      <div key={key} className="flex items-center gap-2">
                        <div className={`size-1.5 rounded-full ${active ? "bg-success" : "bg-muted-foreground/30"}`} />
                        <span className={active ? "text-foreground" : "text-muted-foreground"}>
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit Metadata */}
              <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Audit Info
                </div>
                <div className="space-y-1.5 text-[10px] text-muted-foreground">
                  <div className="truncate" title={audit.id}>
                    ID: <span className="font-mono">{audit.id.slice(0, 12)}...</span>
                  </div>
                  <div>
                    Generated: {formatRelativeTime(audit.completedAt)}
                  </div>
                  {meta?.fetchTimeMs && (
                    <div>
                      Duration: {(meta.fetchTimeMs / 1000).toFixed(1)}s
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
