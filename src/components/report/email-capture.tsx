"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Mail, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Cookie name for lead tracking
const LEAD_COOKIE = "ghai_lead";

// -----------------------------------------------------------------------------
// EmailCaptureForm - The actual form component
// -----------------------------------------------------------------------------

interface EmailCaptureFormProps {
  auditId: string;
  capturePoint: string;
  onSuccess?: (leadId: string) => void;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  showName?: boolean;
  showCompany?: boolean;
  compact?: boolean;
}

export function EmailCaptureForm({
  auditId,
  capturePoint,
  onSuccess,
  onClose,
  title = "Get the Full Report",
  subtitle = "Enter your email to unlock detailed insights and recommendations.",
  showName = true,
  showCompany = false,
  compact = false,
}: EmailCaptureFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Get UTM params from URL
  const getUtmParams = useCallback(() => {
    if (typeof window === "undefined") return {};
    const params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get("utm_source") || undefined,
      utmMedium: params.get("utm_medium") || undefined,
      utmCampaign: params.get("utm_campaign") || undefined,
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !consent) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const utmParams = getUtmParams();

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: showName ? name : undefined,
          company: showCompany ? company : undefined,
          capturePoint,
          auditId,
          referrer: document.referrer || undefined,
          consentGiven: consent,
          ...utmParams,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit");
      }

      setIsSuccess(true);
      onSuccess?.(data.leadId);

      // Close after a brief delay on success
      if (onClose) {
        setTimeout(onClose, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`text-center ${compact ? "py-4" : "py-8"}`}>
        <CheckCircle className="size-12 text-success mx-auto mb-4" />
        <h3 className="text-lg font-semibold">Thank You!</h3>
        <p className="text-sm text-muted-foreground mt-2">
          You now have full access to this report.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!compact && (
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
        </div>
      )}

      <div className="space-y-3">
        <Input
          type="email"
          placeholder="Email address *"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />

        {showName && (
          <Input
            type="text"
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}

        {showCompany && (
          <Input
            type="text"
            placeholder="Company (optional)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        )}
      </div>

      {/* GDPR Consent */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 rounded"
          required
        />
        <span className="text-xs text-muted-foreground">
          I agree to receive marketing communications and understand my data will
          be processed according to the{" "}
          <a href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </a>
          . You can unsubscribe at any time.
        </span>
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || !email || !consent}
      >
        {isSubmitting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            <Mail className="size-4" />
            Get Access
          </>
        )}
      </Button>
    </form>
  );
}

// -----------------------------------------------------------------------------
// EmailCaptureOverlay - Scroll-triggered overlay
// -----------------------------------------------------------------------------

interface EmailCaptureOverlayProps {
  auditId: string;
  triggerPercent?: number; // Scroll percentage to trigger (default 80%)
  delay?: number; // Delay after trigger in ms (default 500)
}

export function EmailCaptureOverlay({
  auditId,
  triggerPercent = 80,
  delay = 500,
}: EmailCaptureOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasLead, setHasLead] = useState(false);
  const hasTriggeredRef = useRef(false);

  // Check if user already has lead cookie
  useEffect(() => {
    const leadCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${LEAD_COOKIE}=`));

    if (leadCookie) {
      setHasLead(true);
    }
  }, []);

  // Check sessionStorage for dismissal
  useEffect(() => {
    const dismissed = sessionStorage.getItem(`email_capture_dismissed_${auditId}`);
    if (dismissed) {
      setIsDismissed(true);
    }
  }, [auditId]);

  // Track scroll depth
  useEffect(() => {
    if (hasLead || isDismissed || hasTriggeredRef.current) return;

    const checkScrollDepth = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      const scrollableHeight = scrollHeight - clientHeight;
      if (scrollableHeight <= 0) return;

      const scrollPercent = Math.round((scrollTop / scrollableHeight) * 100);

      if (scrollPercent >= triggerPercent && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true;

        // Show with delay
        setTimeout(() => {
          setIsVisible(true);
        }, delay);
      }
    };

    window.addEventListener("scroll", checkScrollDepth, { passive: true });
    checkScrollDepth(); // Check initial position

    return () => {
      window.removeEventListener("scroll", checkScrollDepth);
    };
  }, [hasLead, isDismissed, triggerPercent, delay]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem(`email_capture_dismissed_${auditId}`, "true");
  };

  const handleSuccess = () => {
    setHasLead(true);
    // Brief delay before closing
    setTimeout(() => {
      setIsVisible(false);
    }, 1500);
  };

  // Don't render if already captured or permanently dismissed
  if (hasLead || !isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md relative animate-in zoom-in-95 fade-in duration-200">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleDismiss}
          >
            <X className="size-4" />
          </Button>

          <CardHeader className="pb-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Mail className="size-6 text-primary" />
            </div>
            <CardTitle className="text-center text-xl">
              Enjoying the insights?
            </CardTitle>
          </CardHeader>

          <CardContent>
            <EmailCaptureForm
              auditId={auditId}
              capturePoint="scroll_80"
              onSuccess={handleSuccess}
              onClose={handleDismiss}
              title=""
              subtitle="Get notified when we update this report with fresh data."
              showName={false}
              showCompany={false}
              compact
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// -----------------------------------------------------------------------------
// useLeadStatus - Hook to check if user is a captured lead
// -----------------------------------------------------------------------------

export function useLeadStatus() {
  const [isLead, setIsLead] = useState<boolean | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);

  useEffect(() => {
    const leadCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${LEAD_COOKIE}=`));

    if (leadCookie) {
      const id = leadCookie.split("=")[1];
      setLeadId(id);
      setIsLead(true);
    } else {
      setIsLead(false);
    }
  }, []);

  return { isLead, leadId };
}
