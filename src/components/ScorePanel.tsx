"use client";

import { useState } from "react";
import type { Grant, ScoringResult } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  recommendationColor,
} from "@/lib/format";

export default function ScorePanel({
  grant,
  onScored,
}: {
  grant: Grant;
  onScored: (updated: Grant) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scoring = grant.scoring;

  async function runScore() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/grants/${grant.id}/score`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scoring failed");
      onScored(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scoring failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">AI valuation</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Scored against the ETC mission profile.
          </p>
        </div>
        <button
          onClick={runScore}
          disabled={loading}
          className="shrink-0 rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Scoring…" : scoring ? "Re-score" : "Score with AI"}
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {!scoring && !error && (
        <p className="mt-6 text-sm text-slate-500">
          No valuation yet. Click <span className="font-medium">Score with AI</span> to
          get a fit score, win probability, expected value, and a recommendation.
        </p>
      )}

      {scoring && <ScoreDetail grant={grant} scoring={scoring} />}
    </section>
  );
}

function ScoreDetail({ grant, scoring }: { grant: Grant; scoring: ScoringResult }) {
  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <Metric label="Fit score" value={`${scoring.overallScore}/100`} />
        <Metric
          label="Recommendation"
          value={
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-sm font-medium capitalize ${recommendationColor(
                scoring.recommendation,
              )}`}
            >
              {scoring.recommendation}
            </span>
          }
        />
        <Metric label="Win probability" value={`${Math.round(scoring.winProbability * 100)}%`} />
        <Metric
          label="Expected value"
          value={formatCurrency(scoring.expectedValue)}
          hint={`${formatCurrency(grant.amount)} × win prob.`}
        />
      </div>

      <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
        {scoring.summary}
      </p>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-900">Criteria breakdown</h3>
        <div className="space-y-3">
          {scoring.criteria.map((c) => (
            <div key={c.key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-800">{c.label}</span>
                <span className="text-slate-500">
                  {c.score}/100 · weight {Math.round(c.weight * 100)}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${c.score}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">{c.rationale}</p>
            </div>
          ))}
        </div>
      </div>

      {scoring.redFlags.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-rose-700">Red flags</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-rose-700">
            {scoring.redFlags.map((flag, i) => (
              <li key={i}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-slate-400">
        Scored {formatDate(scoring.scoredAt)} · {scoring.model}
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-slate-900">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}
