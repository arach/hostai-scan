"use client"

import { useState } from "react"
import { PublicScoreGauge } from "@/components/report"
import { ScoreGauge } from "@/components/score-gauge"

export default function GaugeDevPage() {
  const [score, setScore] = useState(72)

  const presetScores = [
    { label: "Urgent", score: 35 },
    { label: "Needs Work", score: 58 },
    { label: "Excellent", score: 85 },
  ]

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
              DEV
            </span>
            <h1 className="text-lg font-semibold text-gray-900">Score Gauge Preview</h1>
          </div>
          <p className="text-gray-500 text-sm">
            Compare gauge styles and preview different scores
          </p>
        </div>

        {/* Score slider */}
        <div className="mb-8 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">Score</label>
            <span className="text-sm font-mono text-gray-900 bg-white px-2 py-1 rounded border">
              {score}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
          <div className="flex gap-2 mt-4">
            {presetScores.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setScore(preset.score)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  score === preset.score
                    ? "bg-purple-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gauge comparison */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* New Public Gauge */}
          <div className="p-8 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-sm font-medium text-gray-500 mb-6 text-center">
              Public Score Gauge (New)
            </h2>
            <div className="flex flex-col items-center gap-8">
              <PublicScoreGauge score={score} size="xl" />
              <div className="flex gap-6">
                <PublicScoreGauge score={score} size="md" showLabel={false} />
                <PublicScoreGauge score={score} size="sm" showLabel={false} />
              </div>
            </div>
          </div>

          {/* Existing Admin Gauge */}
          <div className="p-8 bg-gray-900 rounded-2xl">
            <h2 className="text-sm font-medium text-gray-400 mb-6 text-center">
              Admin Score Gauge (Existing)
            </h2>
            <div className="flex flex-col items-center gap-8">
              <ScoreGauge score={score} size="lg" />
              <div className="flex gap-6">
                <ScoreGauge score={score} size="md" />
                <ScoreGauge score={score} size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Size variants */}
        <div className="mt-8 p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100">
          <h2 className="text-sm font-medium text-gray-500 mb-6">All Sizes</h2>
          <div className="flex items-end justify-center gap-8">
            <div className="flex flex-col items-center">
              <PublicScoreGauge score={score} size="sm" />
              <span className="mt-2 text-xs text-gray-400">sm</span>
            </div>
            <div className="flex flex-col items-center">
              <PublicScoreGauge score={score} size="md" />
              <span className="mt-2 text-xs text-gray-400">md</span>
            </div>
            <div className="flex flex-col items-center">
              <PublicScoreGauge score={score} size="lg" />
              <span className="mt-2 text-xs text-gray-400">lg</span>
            </div>
            <div className="flex flex-col items-center">
              <PublicScoreGauge score={score} size="xl" />
              <span className="mt-2 text-xs text-gray-400">xl</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
