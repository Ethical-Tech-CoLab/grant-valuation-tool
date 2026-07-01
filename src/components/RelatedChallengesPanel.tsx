"use client";

import { useState } from "react";
import type { Grant } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";

interface Candidate {
  name: string;
  funder: string;
  url: string;
  amount: number;
  deadline: string | null;
  focusAreas: string[];
  summary: string;
  whyFit: string;
  fit: "strong" | "possible" | "weak";
  status: "open" | "unclear" | "closed";
}

const fitBadge: Record<Candidate["fit"], string> = {
  strong: "bg-emerald-100 text-emerald-800 border-emerald-200",
  possible: "bg-amber-100 text-amber-800 border-amber-200",
  weak: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function RelatedChallengesPanel({ grant }: { grant: Grant }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [added, setAdded] = useState<Record<string, boolean>>({});

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/grants/${grant.id}/related`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setCandidates(data.candidates ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function add(c: Candidate) {
    const key = c.url || c.name;
    try {
      const res = await fetch("/api/grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: c.name,
          funder: c.funder,
          amount: c.amount,
          deadline: c.deadline,
          url: c.url,
          description: c.summary,
          focusAreas: c.focusAreas,
          availability: c.status === "open" ? "open" : null,
          stage: "prospect",
        }),
      });
      if (res.ok) setAdded((s) => ({ ...s, [key]: true }));
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Similar challenges</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Find other coalitions / challenges like this one to also target.
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="shrink-0 rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Searching…" : candidates ? "Search again" : "Find similar"}
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}

      {candidates && candidates.length === 0 && !loading && (
        <p className="mt-4 text-sm text-slate-500">
          No new similar challenges surfaced. Try again or broaden the grant&apos;s focus areas.
        </p>
      )}

      {candidates && candidates.length > 0 && (
        <ul className="mt-4 space-y-3">
          {candidates.map((c) => {
            const key = c.url || c.name;
            return (
              <li key={key} className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{c.name}</span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${fitBadge[c.fit]}`}
                      >
                        {c.fit} fit
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{c.funder || "Unknown funder"}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {c.url && (
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:border-slate-300 hover:text-slate-900"
                      >
                        Open ↗
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => add(c)}
                      disabled={added[key]}
                      className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                    >
                      {added[key] ? "Added ✓" : "Add"}
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                  <span>{c.amount ? formatCurrency(c.amount) : "—"}</span>
                  <span>Deadline: {formatDate(c.deadline)}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{c.summary}</p>
                {c.whyFit && (
                  <p className="mt-1.5 text-xs text-indigo-800">
                    <span className="font-semibold">Why:</span> {c.whyFit}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
