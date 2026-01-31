"use client";

import { useState } from "react";
import {
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  DollarSign,
  ChevronRight,
  ChevronDown,
  Share2,
  Check,
  ShoppingCart,
  Shield,
  Gauge,
  FileText,
  Search,
  Lock,
  Phone,
  Mail,
  MapPin,
  Star,
  Calendar,
  MousePointer,
  ExternalLink,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreGauge } from "@/components/score-gauge";
import type { AuditResult, AuditRecommendation, AuditCategory } from "@/types/audit";

interface ReportDashboardProps {
  result: AuditResult;
  onReset?: () => void;
}

// Category metadata with icons, descriptions, and benchmarks
const CATEGORY_META: Record<
  string,
  {
    icon: React.ReactNode;
    description: string;
    whyItMatters: string;
    benchmark: { poor: number; fair: number; good: number };
    tips: string[];
  }
> = {
  Conversion: {
    icon: <ShoppingCart className="size-5" />,
    description: "How effectively your site turns visitors into bookings",
    whyItMatters:
      "Every 10-point improvement in conversion score can mean 15-25% more direct bookings. A clear booking flow reduces abandonment and captures guests who might otherwise book through OTAs.",
    benchmark: { poor: 40, fair: 60, good: 80 },
    tips: [
      "Place your 'Book Now' button above the fold",
      "Show real-time availability with a date picker",
      "Enable instant booking to reduce friction",
      "Display pricing upfront to set expectations",
    ],
  },
  Performance: {
    icon: <Gauge className="size-5" />,
    description: "Page speed and mobile experience quality",
    whyItMatters:
      "53% of mobile users abandon sites that take over 3 seconds to load. Google also uses page speed as a ranking factor, affecting your visibility in search results.",
    benchmark: { poor: 50, fair: 70, good: 90 },
    tips: [
      "Optimize and compress your property images",
      "Use a CDN to serve content faster globally",
      "Minimize JavaScript and CSS files",
      "Enable browser caching for repeat visitors",
    ],
  },
  Trust: {
    icon: <Shield className="size-5" />,
    description: "Credibility signals that make guests confident to book",
    whyItMatters:
      "93% of travelers read reviews before booking. Trust signals like verified reviews, contact info, and security badges reduce booking anxiety and increase conversion rates by up to 40%.",
    benchmark: { poor: 30, fair: 50, good: 70 },
    tips: [
      "Display reviews from Google, Airbnb, or VRBO",
      "Add a visible phone number and email",
      "Show trust badges (Superhost, verified host)",
      "Include a privacy policy and terms of service",
    ],
  },
  Content: {
    icon: <FileText className="size-5" />,
    description: "Quality and completeness of property information",
    whyItMatters:
      "Listings with 20+ high-quality photos get 2x more inquiries. Detailed descriptions help guests imagine their stay and reduce questions that slow down bookings.",
    benchmark: { poor: 40, fair: 60, good: 80 },
    tips: [
      "Add at least 20 high-quality property photos",
      "Include photos of every room and outdoor spaces",
      "Write detailed descriptions of amenities",
      "Add guest testimonials with photos",
    ],
  },
  SEO: {
    icon: <Search className="size-5" />,
    description: "Search engine visibility and organic traffic potential",
    whyItMatters:
      "Organic search is the #1 source of direct bookings for vacation rentals. Good SEO means free, ongoing traffic from guests actively searching for properties like yours.",
    benchmark: { poor: 40, fair: 60, good: 80 },
    tips: [
      "Add unique meta titles and descriptions",
      "Include location keywords naturally in content",
      "Build local backlinks from tourism sites",
      "Create content about local attractions",
    ],
  },
  Security: {
    icon: <Lock className="size-5" />,
    description: "SSL and data protection measures",
    whyItMatters:
      "Sites without HTTPS show 'Not Secure' warnings in browsers, instantly destroying trust. SSL is also a Google ranking factor and required for processing payments.",
    benchmark: { poor: 0, fair: 50, good: 100 },
    tips: [
      "Install an SSL certificate (many hosts offer free ones)",
      "Ensure all pages load over HTTPS",
      "Use secure payment processors",
    ],
  },
};

function getStatusIcon(status: AuditRecommendation["status"]) {
  switch (status) {
    case "pass":
      return <CheckCircle2 className="size-4 text-success" />;
    case "fail":
      return <XCircle className="size-4 text-error" />;
    case "warning":
      return <AlertTriangle className="size-4 text-warning" />;
  }
}

function getImpactColor(impact: AuditRecommendation["impact"]) {
  switch (impact) {
    case "High":
      return "error";
    case "Medium":
      return "warning";
    case "Low":
      return "secondary";
  }
}

function getScoreLabel(score: number, benchmark: { poor: number; fair: number; good: number }) {
  if (score >= benchmark.good) return { label: "Excellent", color: "text-success" };
  if (score >= benchmark.fair) return { label: "Fair", color: "text-warning" };
  return { label: "Needs Work", color: "text-error" };
}

function ScoreBar({ score, benchmark }: { score: number; benchmark: { poor: number; fair: number; good: number } }) {
  return (
    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
      {/* Benchmark markers */}
      <div
        className="absolute top-0 bottom-0 w-px bg-border z-10"
        style={{ left: `${benchmark.fair}%` }}
      />
      <div
        className="absolute top-0 bottom-0 w-px bg-border z-10"
        style={{ left: `${benchmark.good}%` }}
      />
      {/* Score fill */}
      <div
        className={`h-full transition-all duration-500 ${
          score >= benchmark.good
            ? "bg-success"
            : score >= benchmark.fair
            ? "bg-warning"
            : "bg-error"
        }`}
        style={{ width: `${Math.min(score, 100)}%` }}
      />
    </div>
  );
}

// Expandable Category Section Component
function CategorySection({
  category,
  recommendations,
  bookingFlow,
  trustSignals,
  isExpanded,
  onToggle,
}: {
  category: AuditCategory;
  recommendations: AuditRecommendation[];
  bookingFlow?: AuditResult["bookingFlow"];
  trustSignals?: AuditResult["trustSignals"];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const meta = CATEGORY_META[category.name] || {
    icon: <Info className="size-5" />,
    description: category.description,
    whyItMatters: "",
    benchmark: { poor: 40, fair: 60, good: 80 },
    tips: [],
  };

  const scoreInfo = getScoreLabel(category.score, meta.benchmark);
  const categoryRecs = recommendations.filter((r) => r.category === category.name);
  const passedRecs = categoryRecs.filter((r) => r.status === "pass");
  const failedRecs = categoryRecs.filter((r) => r.status === "fail");
  const warningRecs = categoryRecs.filter((r) => r.status === "warning");

  return (
    <Card className="overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left p-6 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-start gap-4">
          {/* Icon and Score */}
          <div
            className={`p-3 rounded-lg ${
              category.score >= meta.benchmark.good
                ? "bg-success/10 text-success"
                : category.score >= meta.benchmark.fair
                ? "bg-warning/10 text-warning"
                : "bg-error/10 text-error"
            }`}
          >
            {meta.icon}
          </div>

          {/* Title and Description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-semibold">{category.name}</h3>
              <Badge variant={category.score >= meta.benchmark.good ? "success" : category.score >= meta.benchmark.fair ? "warning" : "error"}>
                {category.score}/100
              </Badge>
              <span className={`text-sm font-medium ${scoreInfo.color}`}>
                {scoreInfo.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{meta.description}</p>

            {/* Quick stats */}
            <div className="flex items-center gap-4 mt-3 text-sm">
              {failedRecs.length > 0 && (
                <span className="flex items-center gap-1 text-error">
                  <XCircle className="size-3" />
                  {failedRecs.length} issue{failedRecs.length !== 1 ? "s" : ""}
                </span>
              )}
              {warningRecs.length > 0 && (
                <span className="flex items-center gap-1 text-warning">
                  <AlertTriangle className="size-3" />
                  {warningRecs.length} warning{warningRecs.length !== 1 ? "s" : ""}
                </span>
              )}
              {passedRecs.length > 0 && (
                <span className="flex items-center gap-1 text-success">
                  <CheckCircle2 className="size-3" />
                  {passedRecs.length} passed
                </span>
              )}
            </div>
          </div>

          {/* Expand indicator */}
          <div className="text-muted-foreground">
            {isExpanded ? (
              <ChevronDown className="size-5" />
            ) : (
              <ChevronRight className="size-5" />
            )}
          </div>
        </div>

        {/* Score bar */}
        <div className="mt-4">
          <ScoreBar score={category.score} benchmark={meta.benchmark} />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Poor</span>
            <span>Fair ({meta.benchmark.fair}+)</span>
            <span>Good ({meta.benchmark.good}+)</span>
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Why it matters */}
          <div className="p-6 bg-muted/30">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Info className="size-4" />
              Why This Matters
            </h4>
            <p className="text-sm text-muted-foreground">{meta.whyItMatters}</p>
          </div>

          {/* Category-specific details */}
          {category.name === "Conversion" && bookingFlow && (
            <BookingFlowDetails bookingFlow={bookingFlow} />
          )}
          {category.name === "Trust" && trustSignals && (
            <TrustSignalDetails trustSignals={trustSignals} />
          )}

          {/* Recommendations for this category */}
          {categoryRecs.length > 0 && (
            <div className="p-6">
              <h4 className="font-medium mb-4">Detailed Findings</h4>
              <div className="space-y-3">
                {categoryRecs.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-4 rounded-lg border ${
                      rec.status === "fail"
                        ? "border-error/30 bg-error/5"
                        : rec.status === "warning"
                        ? "border-warning/30 bg-warning/5"
                        : "border-success/30 bg-success/5"
                    }`}
                  >
                    <div className="mt-0.5">{getStatusIcon(rec.status)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{rec.title}</span>
                        <Badge
                          variant={getImpactColor(rec.impact) as "error" | "warning" | "secondary"}
                        >
                          {rec.impact} Impact
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {rec.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {meta.tips.length > 0 && (
            <div className="p-6 border-t border-border bg-primary/5">
              <h4 className="font-medium mb-3">Quick Wins to Improve</h4>
              <ul className="space-y-2">
                {meta.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <ChevronRight className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// Booking Flow Details Component
function BookingFlowDetails({ bookingFlow }: { bookingFlow: NonNullable<AuditResult["bookingFlow"]> }) {
  return (
    <div className="p-6 border-t border-border">
      <h4 className="font-medium mb-4">Booking Flow Analysis</h4>
      <div className="grid sm:grid-cols-2 gap-4">
        {/* CTA Status */}
        <div className="p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-2">
            <MousePointer className="size-4 text-muted-foreground" />
            <span className="font-medium">Call-to-Action</span>
          </div>
          {bookingFlow.hasBookingCTA ? (
            <div>
              <Badge variant={bookingFlow.ctaLocation === "above-fold" ? "success" : "warning"}>
                {bookingFlow.ctaText || "Found"}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                {bookingFlow.ctaLocation === "above-fold"
                  ? "Visible immediately when page loads"
                  : "Below the fold - visitors must scroll to find it"}
              </p>
            </div>
          ) : (
            <div>
              <Badge variant="error">Not Found</Badge>
              <p className="text-sm text-muted-foreground mt-2">
                No clear booking button detected. Visitors may not know how to book.
              </p>
            </div>
          )}
        </div>

        {/* Booking Engine */}
        <div className="p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="font-medium">Booking System</span>
          </div>
          {bookingFlow.bookingEngine ? (
            <div>
              <Badge variant={bookingFlow.bookingEngine.type === "embedded" ? "success" : "warning"}>
                {bookingFlow.bookingEngine.name}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                {bookingFlow.bookingEngine.type === "embedded"
                  ? "Embedded widget - guests stay on your site"
                  : "Redirects to external site - may lose some guests"}
              </p>
            </div>
          ) : (
            <div>
              <Badge variant="error">Not Detected</Badge>
              <p className="text-sm text-muted-foreground mt-2">
                No booking widget found. Consider adding Lodgify, Guesty, or OwnerRez.
              </p>
            </div>
          )}
        </div>

        {/* Date Picker */}
        <div className="p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="font-medium">Date Selection</span>
          </div>
          <Badge variant={bookingFlow.hasDatePicker ? "success" : "error"}>
            {bookingFlow.hasDatePicker ? "Available" : "Not Found"}
          </Badge>
          <p className="text-sm text-muted-foreground mt-2">
            {bookingFlow.hasDatePicker
              ? "Guests can check availability directly"
              : "No date picker found - guests can't see availability"}
          </p>
        </div>

        {/* Friction Score */}
        <div className="p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="size-4 text-muted-foreground" />
            <span className="font-medium">Booking Friction</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold ${
                bookingFlow.frictionScore < 30
                  ? "text-success"
                  : bookingFlow.frictionScore < 60
                  ? "text-warning"
                  : "text-error"
              }`}
            >
              {bookingFlow.estimatedClicksToBook}
            </span>
            <span className="text-sm text-muted-foreground">clicks to book</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {bookingFlow.estimatedClicksToBook <= 3
              ? "Excellent! Quick and easy booking process."
              : bookingFlow.estimatedClicksToBook <= 5
              ? "Acceptable, but could be streamlined."
              : "Too many steps. Aim for 3 clicks or fewer."}
          </p>
        </div>
      </div>
    </div>
  );
}

// Trust Signals Details Component
function TrustSignalDetails({ trustSignals }: { trustSignals: NonNullable<AuditResult["trustSignals"]> }) {
  const detectedSocials = trustSignals.hasSocialProfiles.filter((p) => p.detected);

  return (
    <div className="p-6 border-t border-border">
      <h4 className="font-medium mb-4">Trust Signal Analysis</h4>
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Reviews */}
        <div className="p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Star className="size-4 text-muted-foreground" />
            <span className="font-medium">Guest Reviews</span>
          </div>
          {trustSignals.hasReviews ? (
            <div>
              <div className="flex items-center gap-2">
                <Badge variant={trustSignals.reviewSource?.isVerified ? "success" : "warning"}>
                  {trustSignals.reviewSource?.name || "Found"}
                </Badge>
                {trustSignals.averageRating && (
                  <span className="text-sm font-medium">
                    {trustSignals.averageRating}/5
                  </span>
                )}
                {trustSignals.reviewCount && (
                  <span className="text-sm text-muted-foreground">
                    ({trustSignals.reviewCount} reviews)
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {trustSignals.reviewSource?.isVerified
                  ? "Verified reviews from a trusted platform"
                  : "Consider adding verified reviews from Google or Airbnb"}
              </p>
            </div>
          ) : (
            <div>
              <Badge variant="error">No Reviews Found</Badge>
              <p className="text-sm text-muted-foreground mt-2">
                93% of travelers read reviews before booking. This is critical.
              </p>
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="size-4 text-muted-foreground" />
            <span className="font-medium">Contact Information</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={trustSignals.hasPhoneNumber ? "success" : "secondary"}>
              <Phone className="size-3 mr-1" />
              Phone
            </Badge>
            <Badge variant={trustSignals.hasEmailAddress ? "success" : "secondary"}>
              <Mail className="size-3 mr-1" />
              Email
            </Badge>
            <Badge variant={trustSignals.hasPhysicalAddress ? "success" : "secondary"}>
              <MapPin className="size-3 mr-1" />
              Address
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {trustSignals.hasPhoneNumber && trustSignals.hasEmailAddress
              ? "Good contact visibility builds guest confidence"
              : "Add more contact options so guests can reach you"}
          </p>
        </div>

        {/* Trust Badges */}
        <div className="p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="size-4 text-muted-foreground" />
            <span className="font-medium">Trust Badges</span>
          </div>
          {trustSignals.trustBadges.length > 0 ? (
            <div>
              <div className="flex flex-wrap gap-2">
                {trustSignals.trustBadges.slice(0, 4).map((badge, idx) => (
                  <Badge key={idx} variant="success">
                    {badge.name}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Trust badges reduce booking anxiety
              </p>
            </div>
          ) : (
            <div>
              <Badge variant="secondary">None Detected</Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Add badges like Superhost, Verified Host, or security seals
              </p>
            </div>
          )}
        </div>

        {/* Social Presence */}
        <div className="p-4 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-2">
            <ExternalLink className="size-4 text-muted-foreground" />
            <span className="font-medium">Social Presence</span>
          </div>
          {detectedSocials.length > 0 ? (
            <div>
              <div className="flex flex-wrap gap-2">
                {detectedSocials.slice(0, 4).map((platform, idx) => (
                  <Badge key={idx} variant="success">
                    {platform.platform}
                  </Badge>
                ))}
                {detectedSocials.length > 4 && (
                  <Badge variant="secondary">+{detectedSocials.length - 4}</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Active social presence shows you're a real, engaged business
              </p>
            </div>
          ) : (
            <div>
              <Badge variant="secondary">No Links Found</Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Link to your social profiles to build credibility
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Legal Pages */}
      <div className="mt-4 p-4 rounded-lg border border-border">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="size-4 text-muted-foreground" />
          <span className="font-medium">Legal & Compliance</span>
        </div>
        <div className="flex gap-2">
          <Badge variant={trustSignals.hasPrivacyPolicy ? "success" : "error"}>
            Privacy Policy
          </Badge>
        </div>
        {!trustSignals.hasPrivacyPolicy && (
          <p className="text-sm text-muted-foreground mt-2">
            A privacy policy is legally required in most jurisdictions and builds trust
          </p>
        )}
      </div>
    </div>
  );
}

export function ReportDashboard({ result, onReset }: ReportDashboardProps) {
  const [copied, setCopied] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["Conversion", "Trust"]) // Expand the most important ones by default
  );

  const failedCount = result.recommendations.filter((r) => r.status === "fail").length;
  const passedCount = result.recommendations.filter((r) => r.status === "pass").length;
  const warningCount = result.recommendations.filter((r) => r.status === "warning").length;

  const shareUrl = result.auditId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/report/${result.auditId}`
    : null;

  const handleShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy");
    }
  };

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(result.categories.map((c) => c.name)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  // Get overall health interpretation
  const getOverallInterpretation = (score: number) => {
    if (score >= 80) {
      return {
        label: "Strong",
        description:
          "Your site is performing well. Focus on fine-tuning to maximize direct bookings.",
        color: "text-success",
      };
    }
    if (score >= 60) {
      return {
        label: "Fair",
        description:
          "Your site has solid foundations but several issues may be costing you bookings.",
        color: "text-warning",
      };
    }
    if (score >= 40) {
      return {
        label: "Needs Work",
        description:
          "Significant improvements needed. You're likely losing bookings to competitors.",
        color: "text-orange-500",
      };
    }
    return {
      label: "Critical",
      description:
        "Major issues detected. Your site may be actively driving guests away.",
      color: "text-error",
    };
  };

  const overallInterpretation = getOverallInterpretation(result.overallScore);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onReset ? (
              <>
                <Button variant="ghost" size="sm" onClick={onReset}>
                  <ArrowLeft className="size-4" />
                  New Audit
                </Button>
                <div className="h-6 w-px bg-border" />
              </>
            ) : (
              <a href="/" className="text-primary hover:underline text-sm">
                Run Your Own Audit
              </a>
            )}
            <span className="font-semibold">{result.domain}</span>
          </div>
          <div className="flex items-center gap-2">
            {shareUrl && (
              <Button variant="outline" size="sm" onClick={handleShare}>
                {copied ? (
                  <>
                    <Check className="size-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="size-4" />
                    Share Report
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section - Overall Score */}
        <Card className="mb-8 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Score side */}
            <div className="p-8 flex flex-col items-center justify-center bg-muted/30">
              <ScoreGauge score={result.overallScore} size="lg" />
              <div className="mt-4 text-center">
                <h2 className={`text-xl font-bold ${overallInterpretation.color}`}>
                  {overallInterpretation.label}
                </h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  {overallInterpretation.description}
                </p>
              </div>
            </div>

            {/* Stats side */}
            <div className="p-8 space-y-6">
              {/* Issues summary */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Issues Found
                </h3>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="size-10 rounded-lg bg-error/10 flex items-center justify-center">
                      <XCircle className="size-5 text-error" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{failedCount}</div>
                      <div className="text-xs text-muted-foreground">Critical</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-10 rounded-lg bg-warning/10 flex items-center justify-center">
                      <AlertTriangle className="size-5 text-warning" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{warningCount}</div>
                      <div className="text-xs text-muted-foreground">Warnings</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <CheckCircle2 className="size-5 text-success" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{passedCount}</div>
                      <div className="text-xs text-muted-foreground">Passed</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Potential */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  After Improvements
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-baseline gap-2">
                    <TrendingUp className="size-5 text-success" />
                    <span className="text-3xl font-bold text-success">
                      {result.projectedScore}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      from {result.overallScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* Revenue impact */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Estimated Monthly Impact
                </h3>
                <div className="flex items-center gap-2">
                  <DollarSign className="size-5 text-error" />
                  <span className="text-3xl font-bold text-error">
                    ${result.monthlyRevenueLoss.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">potential loss</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on typical STR conversion rates and your current issues
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Category Sections */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Detailed Analysis</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="ghost" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {result.categories.map((category) => (
            <CategorySection
              key={category.name}
              category={category}
              recommendations={result.recommendations}
              bookingFlow={result.bookingFlow}
              trustSignals={result.trustSignals}
              isExpanded={expandedCategories.has(category.name)}
              onToggle={() => toggleCategory(category.name)}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="py-8">
              <h3 className="text-xl font-bold mb-2">Ready to fix these issues?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Our team can implement these improvements and help you capture that $
                {result.monthlyRevenueLoss.toLocaleString()}/month in potential revenue.
              </p>
              <Button size="lg">
                Schedule a Free Consultation
                <ChevronRight className="size-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
