"use client";

import { useState } from "react";
import type { Grant, GrantTip, RecommendationSet } from "@/lib/types";
import { TIP_CATEGORY_LABELS } from "@/lib/types";
import { formatDate } from "@/lib/format";

const PRIORITY_STYLES: Record<GrantTip["priority"], string> = {
  high: "bg-rose-50 text-rose-700 border-rose-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-50 text-slate-600 border-slate-200",
};

const PRIORITY_ORDER: Record<GrantTip["priority"], number> = { high: 0, medium: 1, low: 2 };

export default function RecommendationsPanel({
  grant,
  onGenerated,
}: {
  grant: Grant;
  onGenerated: (updated: Grant) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recs = grant.recommendations;

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/grants/${grant.id}/recommendations`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generating recommendations failed");
      onGenerated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generating recommendations failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Recommendations &amp; tips</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            A grantseeking playbook tailored to this funder — how to position, what to write, and
            what to do next.
          </p>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="shrink-0 rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Thinking…" : recs ? "Regenerate" : "Get tips with AI"}
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}

      {!recs && !error && (
        <p className="mt-6 text-sm text-slate-500">
          No tips yet. Click <span className="font-medium">Get tips with AI</span> for a prioritized
          set of funder-specific recommendations — positioning, proposal craft, budget, process, and
          the pitfalls to avoid — plus concrete next actions. Add the funder&apos;s review criteria
          and a description for sharper advice.
        </p>
      )}

      {recs && <RecommendationsDetail recs={recs} />}
    </section>
  );
}

function RecommendationsDetail({ recs }: { recs: RecommendationSet }) {
  const tips = [...recs.tips].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  );

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-4 py-3">
        <div className="text-xs font-medium uppercase tracking-wide text-indigo-700">Strategy</div>
        <p className="mt-1 text-sm text-slate-700">{recs.strategy}</p>
      </div>

      {tips.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Tips, most important first</h3>
          <ul className="space-y-2">
            {tips.map((t, i) => (
              <li key={i} className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${PRIORITY_STYLES[t.priority]}`}
                  >
                    {t.priority}
                  </span>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {TIP_CATEGORY_LABELS[t.category] ?? t.category}
                  </span>
                  <span className="text-sm font-semibold text-slate-800">{t.title}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{t.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {recs.actionItems.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-emerald-700">Next actions</h3>
          <ol className="space-y-2">
            {recs.actionItems.map((a, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-medium text-emerald-700">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-700">{a}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <p className="text-xs text-slate-400">
        Generated {formatDate(recs.generatedAt)} · {recs.model} · tailored guidance, not a guarantee
      </p>
    </div>
  );
}
