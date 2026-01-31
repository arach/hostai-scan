"use client";

import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  showGrade?: boolean;
  className?: string;
}

function getGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 50) return "D";
  return "F";
}

function getScoreColor(score: number): string {
  if (score >= 80) return "hsl(var(--success))";
  if (score >= 60) return "hsl(var(--primary))";
  if (score >= 40) return "hsl(var(--warning))";
  return "hsl(var(--error))";
}

const sizeConfig = {
  sm: { dimension: 80, strokeWidth: 4, fontSize: "text-lg" },
  md: { dimension: 120, strokeWidth: 5, fontSize: "text-2xl" },
  lg: { dimension: 160, strokeWidth: 6, fontSize: "text-4xl" },
};

export function ScoreGauge({
  score,
  maxScore = 100,
  size = "md",
  label,
  showGrade = false,
  className,
}: ScoreGaugeProps) {
  const config = sizeConfig[size];
  const radius = (config.dimension - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / maxScore) * circumference;
  const offset = circumference - progress;
  const color = getScoreColor(score);
  const grade = getGrade(score);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className="relative"
        style={{ width: config.dimension, height: config.dimension }}
      >
        <svg
          className="transform -rotate-90"
          width={config.dimension}
          height={config.dimension}
        >
          {/* Background circle */}
          <circle
            cx={config.dimension / 2}
            cy={config.dimension / 2}
            r={radius}
            fill="transparent"
            stroke="hsl(var(--muted))"
            strokeWidth={config.strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={config.dimension / 2}
            cy={config.dimension / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={config.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showGrade ? (
            <span
              className={cn("font-bold", config.fontSize)}
              style={{ color }}
            >
              {grade}
            </span>
          ) : (
            <>
              <span
                className={cn("font-bold leading-none", config.fontSize)}
                style={{ color }}
              >
                {score}
              </span>
              <span className="text-[10px] text-muted-foreground">
                /{maxScore}
              </span>
            </>
          )}
        </div>
      </div>

      {label && (
        <span className="mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  );
}
