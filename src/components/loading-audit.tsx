"use client";

import { Search, Smartphone, Zap, ShieldCheck, Globe, BarChart3 } from "lucide-react";

interface LoadingAuditProps {
  progress?: number;
  currentStep?: string;
}

const steps = [
  { icon: Globe, label: "Fetching website content...", threshold: 20 },
  { icon: Search, label: "Analyzing performance metrics...", threshold: 40 },
  { icon: Smartphone, label: "Scanning for conversion elements...", threshold: 60 },
  { icon: ShieldCheck, label: "Calculating scores...", threshold: 80 },
  { icon: BarChart3, label: "Generating recommendations...", threshold: 90 },
  { icon: Zap, label: "Complete", threshold: 100 },
];

export function LoadingAudit({ progress = 0, currentStep = "Starting..." }: LoadingAuditProps) {
  // Determine which step we're on based on progress
  const activeStepIndex = steps.findIndex((step) => progress < step.threshold);
  const currentStepIndex = activeStepIndex === -1 ? steps.length - 1 : activeStepIndex;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md">
        {/* Animated scanner */}
        <div className="relative w-32 h-32 mx-auto mb-12">
          {/* Outer ring */}
          <div className="absolute inset-0 border-4 border-muted rounded-full" />
          {/* Progress ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="60"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={377}
              strokeDashoffset={377 - (377 * progress) / 100}
              className="transition-all duration-500"
            />
          </svg>
          {/* Inner circle */}
          <div className="absolute inset-4 bg-card rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
            <div className="text-center">
              <span className="text-2xl font-bold text-primary">{progress}%</span>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-2">Auditing Domain</h2>
        <p className="text-muted-foreground mb-2 text-sm">
          {currentStep}
        </p>
        <p className="text-muted-foreground/60 mb-8 text-xs">
          This usually takes 10-30 seconds
        </p>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;

            return (
              <div
                key={index}
                className={`flex items-center gap-4 p-3 rounded-lg border transition-all duration-500 ${
                  isActive
                    ? "border-primary/50 bg-card shadow-lg shadow-primary/10"
                    : isCompleted
                    ? "border-transparent opacity-50"
                    : "border-transparent opacity-30"
                }`}
              >
                <div
                  className={`p-2 rounded-full transition-colors ${
                    isActive
                      ? "bg-primary/20 text-primary"
                      : isCompleted
                      ? "bg-success/20 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                </div>
                <span
                  className={`text-sm font-medium ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
                {isCompleted && (
                  <span className="ml-auto text-success text-xs font-bold">
                    DONE
                  </span>
                )}
                {isActive && (
                  <span className="ml-auto relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
